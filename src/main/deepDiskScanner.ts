import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { CandidateExe } from '../shared/types';

export class DeepDiskScanner {
  // Get all active drive letters (e.g. C:\, D:\, E:\)
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
      // Fallback
      for (const letter of ['C', 'D', 'E', 'F', 'G', 'H']) {
        const p = `${letter}:\\`;
        if (fs.existsSync(p)) drives.push(p);
      }
    }
    return drives;
  }

  public async scanDisks(onProgress?: (msg: string) => void): Promise<CandidateExe[]> {
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

    for (const drive of drives) {
      onProgress?.(`Scanning drive ${drive}...`);
      try {
        const rootEntries = fs.readdirSync(drive, { withFileTypes: true });

        for (const entry of rootEntries) {
          if (!entry.isDirectory()) continue;
          const folderNameLower = entry.name.toLowerCase();

          if (skipFolders.has(folderNameLower) || folderNameLower.startsWith('$')) {
            continue;
          }

          const fullPath = path.join(drive, entry.name);

          // Priority 1: High probability game root folders (e.g. D:\Games, D:\Игры)
          const isGameRoot = commonGamesKeywords.some(k => folderNameLower.includes(k));

          if (isGameRoot) {
            onProgress?.(`Inspecting game directory: ${entry.name}...`);
            this.scanGameFolderContainer(fullPath, results, seenPaths, onProgress);
          } else {
            // Check if root folder itself is a standalone game
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
    try {
      const items = fs.readdirSync(containerPath, { withFileTypes: true });
      for (const item of items) {
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
    const norm = folderPath.toLowerCase();
    if (seenPaths.has(norm)) return;

    try {
      const files = fs.readdirSync(folderPath);
      let isGame = false;
      let exeCandidates: { file: string; score: number; size: number }[] = [];

      // Signature checks
      const hasSteamApi = files.some(f => f.toLowerCase() === 'steam_api64.dll' || f.toLowerCase() === 'steam_api.dll');
      const hasUnity = files.some(f => f.toLowerCase() === 'unityplayer.dll');
      const hasUnreal = files.some(f => f.toLowerCase() === 'engine' || f.toLowerCase() === 'binaries');

      if (hasSteamApi || hasUnity || hasUnreal) {
        isGame = true;
      }

      // Find executables
      for (const f of files) {
        const lower = f.toLowerCase();
        if (!lower.endsWith('.exe')) continue;

        // Skip obvious utility and uninstallation executables
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
          let score = stat.size / 1024 / 1024; // size in MB

          // Prefer exe that matches folder name
          const folderBase = path.basename(folderPath).toLowerCase();
          if (folderBase.includes(lower.replace('.exe', '')) || lower.replace('.exe', '').includes(folderBase)) {
            score += 500;
          }

          exeCandidates.push({ file: f, score, size: stat.size });
        } catch {}
      }

      // If contains Binaries/Win64 (Unreal Engine)
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
        // Sort by best candidate
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
      .replace(/\[.*?\]/g, '') // remove [FitGirl Repack], [DODI], etc.
      .replace(/\(.*?\)/g, '') // remove (v1.0.4), (2024), etc.
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/repack|repack by|gog|rip|deluxe edition|goty/gi, '')
      .trim() || raw;
  }
}

export const deepDiskScanner = new DeepDiskScanner();
