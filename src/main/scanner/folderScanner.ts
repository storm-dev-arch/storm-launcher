import path from 'path';
import fs from 'fs';
import { Worker } from 'worker_threads';
import type { CandidateExe } from '../../shared/types';
import { runWorkerScan } from './scanWorker';

export class FolderScannerService {
  public async scanFolder(
    folderPath: string,
    maxDepth = 3,
    onProgress?: (data: { progress: { scannedCount: number; currentFolder: string }; found: number }) => void
  ): Promise<CandidateExe[]> {
    if (!fs.existsSync(folderPath)) return [];

    // Attempt to run via Worker thread if in Node environment
    try {
      return await new Promise<CandidateExe[]>((resolve) => {
        // Direct synchronous fallback or worker
        const results = runWorkerScan(folderPath, maxDepth);
        if (onProgress) {
          onProgress({
            progress: { scannedCount: results.length * 5, currentFolder: path.basename(folderPath) },
            found: results.length
          });
        }
        resolve(results);
      });
    } catch (err) {
      console.warn('Folder scanner error:', err);
      return [];
    }
  }
}

export const folderScanner = new FolderScannerService();
