import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { CandidateExe } from '../shared/types';

export class DeepDiskScanner {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  private getLogicalDrives(): string[] {
    const drives: string[] = [];
    try {
      const output = execSync('wmic logicaldisk get caption 2>nul', { encoding: 'utf8' });
      const matches = output.match(/[A-Z]:/g);
      if (matches) {
        for (const d of matches) {
          const drivePath = `${d}\\`;
          if (fs.existsSync(drivePath)) {
            drives.push(drivePath);
          }
        }
      }
    } catch {
      for (const letter of ['C', 'D', 'E', 'F', 'G', 'H']) {
        const p = `${letter}:\\`;
        if (fs.existsSync(p)) drives.push(p);
      }
    }
    return drives;
  }

  public async scanDisks(onProgress?: (msg: string) => void): Promise<CandidateExe[]> {
    this.isCancelled = false;
    const results: CandidateExe[] = [];
    const drives = this.getLogicalDrives();
    const seenPaths = new Set<string>();

    const skipFolders = new Set([
      'windows',
      'system volume information',
      '$recycle.bin',
      'programdata',
      'appdata',
      'microsoft',
      'driver',
      'drivers',
      'perflogs',
      'recovery'
    ]);

    const commonGamesKeywords = [
      'games',
      'игры',
      'steamlibrary',
      'repack',
      'gog games',
      'epic games',
      'my games',
      'torrent'
    ];

    for (let i = 0; i < drives.length; i++) {
      if (this.isCancelled) break;
      const drive = drives[i];
      const progressPercent = Math.round((i / drives.length) * 100);
      onProgress?.(`Scanning drive ${drive}... (${progressPercent}%)`);
      try {
        const rootEntries = fs.readdirSync(drive, { withFileTypes: true });

        for (const entry of rootEntries) {
          if (this.isCancelled) break;
          if (!entry.isDirectory()) continue;
          const folderNameLower = entry.name.toLowerCase();

          if (skipFolders.has(folderNameLower) || folderNameLower.startsWith('$')) {
            continue;
          }

          const fullPath = path.join(drive, entry.name);

          const isGameRoot = commonGamesKeywords.some(k => folderNameLower.includes(k));

          if (isGameRoot) {
            onProgress?.(`Inspecting game directory: ${entry.name}...`);
            this.scanGameFolderContainer(fullPath, results, seenPaths, onProgress);
          } else {
            this.checkIfGameFolder(fullPath, results, seenPaths);
          }
        }
      } catch (err) {
        console.warn(`Error scanning drive ${drive}:`, err);
      }
    }

    return results;
  }

  private scanGameFolderContainer(
    containerPath: string,
    results: CandidateExe[],
    seenPaths: Set<string>,
    onProgress?: (msg: string) => void
  ) {
    if (this.isCancelled) return;
    try {
      const items = fs.readdirSync(containerPath, { withFileTypes: true });
      for (const item of items) {
        if (this.isCancelled) return;
        if (!item.isDirectory()) continue;
        const subGamePath = path.join(containerPath, item.name);
        this.checkIfGameFolder(subGamePath, results, seenPaths);
      }
    } catch {}
  }

  private checkIfGameFolder(
    folderPath: string,
    results: CandidateExe[],
    seenPaths: Set<string>
  ) {
    if (this.isCancelled) return;
    const norm = folderPath.toLowerCase();
    if (seenPaths.has(norm)) return;

    try {
      const files = fs.readdirSync(folderPath);
      let isGame = false;
      let exeCandidates: { file: string; score: number; size: number }[] = [];

      const hasSteamApi = files.some(f => f.toLowerCase() === 'steam_api64.dll' || f.toLowerCase() === 'steam_api.dll');
      const hasUnity = files.some(f => f.toLowerCase() === 'unityplayer.dll');
      const hasUnreal = files.some(f => f.toLowerCase() === 'engine' || f.toLowerCase() === 'binaries');

      if (hasSteamApi || hasUnity || hasUnreal) {
        isGame = true;
      }

      for (const f of files) {
        const lower = f.toLowerCase();
        if (!lower.endsWith('.exe')) continue;

        if (
          lower.includes('unins') ||
          lower.includes('crash') ||
          lower.includes('reporter') ||
          lower.includes('update') ||
          lower.includes('setup') ||
          lower.includes('patch') ||
          lower.includes('config') ||
          lower.includes('launcher') && !lower.includes('game')
        ) {
          continue;
        }

        try {
          const stat = fs.statSync(path.join(folderPath, f));
          let score = stat.size / 1024 / 1024;

          const folderBase = path.basename(folderPath).toLowerCase();
          if (folderBase.includes(lower.replace('.exe', '')) || lower.replace('.exe', '').includes(folderBase)) {
            score += 500;
          }

          exeCandidates.push({ file: f, score, size: stat.size });
        } catch {}
      }

      const win64Dir = path.join(folderPath, 'Binaries', 'Win64');
      if (fs.existsSync(win64Dir)) {
        isGame = true;
        try {
          const w64Files = fs.readdirSync(win64Dir);
          for (const f of w64Files) {
            if (f.toLowerCase().endsWith('.exe') && !f.toLowerCase().includes('crash')) {
              const stat = fs.statSync(path.join(win64Dir, f));
              exeCandidates.push({ file: path.join('Binaries', 'Win64', f), score: 800, size: stat.size });
            }
          }
        } catch {}
      }

      if ((isGame || exeCandidates.length > 0) && exeCandidates.length > 0) {
        exeCandidates.sort((a, b) => b.score - a.score);
        const best = exeCandidates[0];
        const fullExePath = path.join(folderPath, best.file);

        seenPaths.add(norm);

        const rawTitle = path.basename(folderPath);
        const cleanTitle = this.cleanGameTitle(rawTitle);

        results.push({
          path: fullExePath,
          name: best.file,
          suggestedTitle: cleanTitle,
          folder: folderPath,
          sizeBytes: best.size,
          sourceLauncher: 'custom'
        });
      }
    } catch {}
  }

  private cleanGameTitle(raw: string): string {
    return raw
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/repack|repack by|gog|rip|deluxe edition|goty/gi, '')
      .trim() || raw;
  }
}

export const deepDiskScanner = new DeepDiskScanner();
