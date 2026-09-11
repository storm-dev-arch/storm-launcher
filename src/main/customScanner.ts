import path from 'path';
import fs from 'fs';
import type { CandidateExe } from '../shared/types';

export class CustomScannerService {
  private ignoredExePatterns = [
    /unins.*\.exe$/i,
    /crash.*\.exe$/i,
    /setup.*\.exe$/i,
    /update.*\.exe$/i,
    /dxsetup.*\.exe$/i,
    /vcredist.*\.exe$/i,
    /helper.*\.exe$/i,
    /service.*\.exe$/i,
    /report.*\.exe$/i,
    /unitycrashhandler.*\.exe$/i
  ];

  public async scanFolder(folderPath: string, maxDepth = 3): Promise<CandidateExe[]> {
    if (!fs.existsSync(folderPath)) return [];
    const results: CandidateExe[] = [];

    const walk = (dir: string, depth: number) => {
      if (depth > maxDepth) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const fullPath = path.join(dir, e.name);
          if (e.isDirectory()) {
            const low = e.name.toLowerCase();
            if (low === 'windows' || low === '$recycle.bin' || low === 'temp' || low === '_redist' || low === 'support') {
              continue;
            }
            walk(fullPath, depth + 1);
          } else if (e.isFile() && e.name.toLowerCase().endsWith('.exe')) {
            if (this.isLikelyGameExe(e.name)) {
              const stat = fs.statSync(fullPath);
              if (stat.size > 200 * 1024) {
                const suggestedTitle = this.formatGameTitle(e.name, dir);
                results.push({
                  path: fullPath,
                  name: e.name,
                  suggestedTitle,
                  folder: dir,
                  sizeBytes: stat.size
                });
              }
            }
          }
        }
      } catch (err) {
      }
    };

    walk(folderPath, 1);
    return results;
  }

  private isLikelyGameExe(filename: string): boolean {
    for (const pattern of this.ignoredExePatterns) {
      if (pattern.test(filename)) return false;
    }
    return true;
  }

  private formatGameTitle(filename: string, dir: string): string {
    const folderName = path.basename(dir);
    const low = folderName.toLowerCase();
    if (low !== 'bin' && low !== 'x64' && low !== 'x86' && low !== 'game' && low !== 'release') {
      return folderName.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    const base = path.basename(filename, path.extname(filename));
    return base.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

export const customScanner = new CustomScannerService();
