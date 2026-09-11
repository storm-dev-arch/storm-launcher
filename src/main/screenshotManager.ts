import fs from 'fs';
import path from 'path';
import { shell } from 'electron';
import { steamScanner } from './steamScanner';

export class ScreenshotManager {
  public getScreenshotsForGame(steamAppId: number): string[] {
    const steamInfo = steamScanner.getSteamStatus();
    if (!steamInfo.path) return [];

    const steamPath = steamInfo.path;
    const userdataDir = path.join(steamPath, 'userdata');
    if (!fs.existsSync(userdataDir)) return [];

    const screenshots: string[] = [];

    try {
      const userFolders = fs.readdirSync(userdataDir, { withFileTypes: true });

      for (const u of userFolders) {
        if (!u.isDirectory() || isNaN(Number(u.name))) continue;

        const screenshotsDir = path.join(userdataDir, u.name, '760', 'remote', String(steamAppId), 'screenshots');
        if (fs.existsSync(screenshotsDir)) {
          const files = fs.readdirSync(screenshotsDir);
          for (const f of files) {
            if (f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png')) {
              const fullPath = path.join(screenshotsDir, f);
              screenshots.push(`play://local/${fullPath.replace(/\\/g, '/')}`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error reading screenshots:', e);
    }

    return screenshots;
  }

  public openScreenshotsFolder(steamAppId: number) {
    const steamInfo = steamScanner.getSteamStatus();
    if (!steamInfo.path) return;

    const userdataDir = path.join(steamInfo.path, 'userdata');
    if (!fs.existsSync(userdataDir)) return;

    try {
      const userFolders = fs.readdirSync(userdataDir, { withFileTypes: true });
      for (const u of userFolders) {
        if (!u.isDirectory() || isNaN(Number(u.name))) continue;
        const screenshotsDir = path.join(userdataDir, u.name, '760', 'remote', String(steamAppId), 'screenshots');
        if (fs.existsSync(screenshotsDir)) {
          shell.openPath(screenshotsDir);
          return;
        }
      }
    } catch {}
  }
}

export const screenshotManager = new ScreenshotManager();
