import { shell, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { Game, SessionRecord } from '../shared/types';
import { db } from './db';
import { discordRPC } from './discordRPC';

interface RunningGameInfo {
  gameId: string;
  gameName: string;
  startTime: number;
  pid?: number;
}

export class GameLauncherService {
  private activeGames = new Map<string, RunningGameInfo>();

  public async launchGame(gameId: string, win?: BrowserWindow | null): Promise<{ success: boolean; error?: string }> {
    const game = db.getGame(gameId);
    if (!game) {
      return { success: false, error: 'Game not found in library.' };
    }

    const startTime = Date.now();
    const runningInfo: RunningGameInfo = {
      gameId: game.id,
      gameName: game.name,
      startTime
    };

    if (!game.installed) {
      if (game.source === 'steam' && game.steamAppId) {
        try {
          await shell.openExternal(`steam://install/${game.steamAppId}`);
          return { success: true };
        } catch (err: any) {
          return { success: false, error: `Failed to open Steam install dialog: ${err?.message || err}` };
        }
      }
      return { success: false, error: 'Game is not installed.' };
    }

    const coverUrl = (game.artwork?.cover && game.artwork.cover.startsWith('http'))
      ? game.artwork.cover
      : (game.artwork?.icon && game.artwork.icon.startsWith('http'))
        ? game.artwork.icon
        : undefined;
    discordRPC.setInGame(game.name, startTime, coverUrl);

    if (game.source === 'steam' && game.steamAppId) {
      try {
        await shell.openExternal(`steam://rungameid/${game.steamAppId}`);
        this.activeGames.set(game.id, runningInfo);

        if (win && !win.isDestroyed()) {
          win.webContents.send('play:game:launched', { ...game, isRunning: true });
        }

        return { success: true };
      } catch (err: any) {
        discordRPC.setIdle(db.getGames().length);
        return { success: false, error: `Failed to launch Steam game: ${err?.message || err}` };
      }
    } else if (game.source === 'epic' && game.launchCommand) {
      try {
        await shell.openExternal(game.launchCommand);
        this.activeGames.set(game.id, runningInfo);

        if (win && !win.isDestroyed()) {
          win.webContents.send('play:game:launched', { ...game, isRunning: true });
        }

        return { success: true };
      } catch (err: any) {
        discordRPC.setIdle(db.getGames().length);
        return { success: false, error: `Failed to launch Epic game: ${err?.message || err}` };
      }
    } else {
      if (!game.executable || !fs.existsSync(game.executable)) {
        discordRPC.setIdle(db.getGames().length);
        return {
          success: false,
          error: 'Game executable was not found on disk. It may have been moved or uninstalled.'
        };
      }

      try {
        const workingDir = game.workingDirectory && fs.existsSync(game.workingDirectory)
          ? game.workingDirectory
          : path.dirname(game.executable);

        const args = game.arguments ? game.arguments.split(' ').filter(Boolean) : [];

        const child = spawn(game.executable, args, {
          cwd: workingDir,
          detached: true,
          stdio: 'ignore'
        });

        child.unref();

        runningInfo.pid = child.pid;
        this.activeGames.set(game.id, runningInfo);

        if (win && !win.isDestroyed()) {
          win.webContents.send('play:game:launched', { ...game, isRunning: true });
        }

        child.on('exit', () => {
          this.endGameSession(game.id, startTime, win);
        });

        return { success: true };
      } catch (err: any) {
        discordRPC.setIdle(db.getGames().length);
        return { success: false, error: `Failed to launch executable: ${err?.message || err}` };
      }
    }
  }

  public stopGame(gameId: string, win?: BrowserWindow | null) {
    const running = this.activeGames.get(gameId);
    if (running) {
      this.endGameSession(gameId, running.startTime, win);
    }
  }

  private endGameSession(gameId: string, startTime: number, win?: BrowserWindow | null) {
    const endTime = Date.now();
    const durationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));

    this.activeGames.delete(gameId);

    discordRPC.setIdle(db.getGames().length);

    const game = db.getGame(gameId);
    if (game) {
      const session: SessionRecord = {
        id: `sess_${Date.now()}`,
        gameId: game.id,
        gameName: game.name,
        startTime,
        endTime,
        durationMinutes
      };

      db.addSession(session);

      game.playtimeMinutes = (game.playtimeMinutes || 0) + durationMinutes;
      game.lastPlayed = endTime;
      game.launchCount = (game.launchCount || 0) + 1;
      game.totalSessionTimeMinutes = (game.totalSessionTimeMinutes || 0) + durationMinutes;
      db.saveGame(game);

      if (win && !win.isDestroyed()) {
        win.webContents.send('play:game:stopped', { gameId: game.id, session });
      }
    }
  }

  public isGameRunning(gameId: string): boolean {
    return this.activeGames.has(gameId);
  }
}

export const gameLauncher = new GameLauncherService();
