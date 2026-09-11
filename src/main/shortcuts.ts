import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { execSync } from 'child_process';
import type { Game } from '../shared/types';

export function createWindowsDesktopShortcut(game: Game): { success: boolean; path?: string; error?: string } {
  try {
    const desktopPath = app.getPath('desktop');
    const safeTitle = game.name.replace(/[/\\?%*:|"<>]/g, '');

    if (game.source === 'steam' && game.steamAppId) {
      // Create .url shortcut with Steam protocol
      const shortcutPath = path.join(desktopPath, `${safeTitle}.url`);
      const content = [
        '[InternetShortcut]',
        `URL=steam://rungameid/${game.steamAppId}`,
        `IconIndex=0`
      ].join('\r\n');

      fs.writeFileSync(shortcutPath, content, 'utf8');
      return { success: true, path: shortcutPath };
    } else if (game.executable && fs.existsSync(game.executable)) {
      const shortcutPath = path.join(desktopPath, `${safeTitle}.lnk`);
      const targetExe = game.executable.replace(/"/g, '');
      const workDir = (game.workingDirectory || path.dirname(game.executable)).replace(/"/g, '');
      const destLnk = shortcutPath.replace(/"/g, '');
      const psCommand = `powershell -NoProfile -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('${destLnk}');$s.TargetPath='${targetExe}';$s.WorkingDirectory='${workDir}';$s.Save()"`;
      execSync(psCommand, { timeout: 3000 });
      return { success: true, path: shortcutPath };
    }

    return { success: false, error: 'No executable or Steam ID available.' };
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) };
  }
}
