import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import type { CandidateExe } from '../../shared/types';

const ignoredExePatterns = [
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

function isLikelyGameExe(filename: string): boolean {
  for (const pattern of ignoredExePatterns) {
    if (pattern.test(filename)) return false;
  }
  return true;
}

function formatGameTitle(filename: string, dir: string): string {
  const folderName = path.basename(dir);
  const low = folderName.toLowerCase();
  if (low !== 'bin' && low !== 'x64' && low !== 'x86' && low !== 'game' && low !== 'release') {
    return folderName.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const base = path.basename(filename, path.extname(filename));
  return base.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function runWorkerScan(folderPath: string, maxDepth = 3): CandidateExe[] {
  if (!fs.existsSync(folderPath)) return [];
  const results: CandidateExe[] = [];
  let scannedCount = 0;

  const walk = (dir: string, depth: number) => {
    if (depth > maxDepth) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      scannedCount += entries.length;

      if (parentPort && scannedCount % 25 === 0) {
        parentPort.postMessage({
          progress: {
            scannedCount,
            currentFolder: path.basename(dir)
          },
          found: results.length
        });
      }

      for (const e of entries) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
          const low = e.name.toLowerCase();
          if (low === 'windows' || low === '$recycle.bin' || low === 'temp' || low === '_redist' || low === 'support') {
            continue;
          }
          walk(fullPath, depth + 1);
        } else if (e.isFile() && e.name.toLowerCase().endsWith('.exe')) {
          if (isLikelyGameExe(e.name)) {
            const stat = fs.statSync(fullPath);
            if (stat.size > 200 * 1024) {
              const suggestedTitle = formatGameTitle(e.name, dir);
              const candidate: CandidateExe = {
                path: fullPath,
                name: e.name,
                suggestedTitle,
                folder: dir,
                sizeBytes: stat.size
              };
              results.push(candidate);
              if (parentPort) {
                parentPort.postMessage({
                  progress: {
                    scannedCount,
                    currentFolder: path.basename(dir)
                  },
                  found: results.length,
                  candidate
                });
              }
            }
          }
        }
      }
    } catch {
      // Ignore permissions/unreadable directories
    }
  };

  walk(folderPath, 1);
  return results;
}

if (parentPort) {
  parentPort.on('message', (msg: { folderPath: string; maxDepth?: number }) => {
    if (msg && msg.folderPath) {
      try {
        const results = runWorkerScan(msg.folderPath, msg.maxDepth || 3);
        parentPort?.postMessage({ done: true, results });
      } catch (err: any) {
        parentPort?.postMessage({ done: true, error: err.message, results: [] });
      }
    }
  });
}
