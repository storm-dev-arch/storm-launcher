import { exec } from 'child_process';
import path from 'path';
import type { BrowserWindow } from 'electron';
import type { SessionRecord } from '../shared/types';
import { db } from './db';
import { discordRPC, DOTA2_ICON_URL } from './discordRPC';
import { gsiService } from './gsiService';

const SYSTEM_EXES = new Set([
  'svchost.exe', 'system', 'system idle process', 'explorer.exe', 'securityhealthsystray.exe',
  'securityhealthservice.exe', 'csrss.exe', 'services.exe', 'taskhostw.exe', 'conhost.exe',
  'dwm.exe', 'runtimebroker.exe', 'sihost.exe', 'dllhost.exe', 'smss.exe', 'wininit.exe',
  'winlogon.exe', 'lsass.exe', 'spoolsv.exe', 'cmd.exe', 'powershell.exe', 'electron.exe',
  'storm launcher.exe', 'storm-launcher.exe', 'taskmgr.exe', 'searchapp.exe', 'startmenuexperiencehost.exe',
  'applicationframehost.exe', 'shellexperiencehost.exe', 'ctfmon.exe', 'textinputhost.exe',
  'audiodg.exe', 'fontdrvhost.exe', 'smartscreen.exe', 'compattelrunner.exe', 'searchindexer.exe',
  'wudfhost.exe', 'nvcontainer.exe', 'nvdisplay.container.exe', 'msmpeng.exe', 'mpdefendercoreservice.exe'
]);

export class ProcessWatcherService {
  private timer: NodeJS.Timeout | null = null;
  private activeGameName: string | null = null;
  private activeGameStart: number = 0;
  private activeCoverUrl: string | undefined = undefined;
  private activeIsTool = false;
  private isChecking = false;
  private win: BrowserWindow | null = null;

  public setWindow(win: BrowserWindow | null) {
    this.win = win;
  }

  public refreshLanguage() {
    if (this.activeGameName && this.activeGameName !== 'GSI') {
      discordRPC.setInGame(this.activeGameName, this.activeGameStart, this.activeCoverUrl, this.activeIsTool);
    } else if (!this.activeGameName) {
      discordRPC.setIdle(db.getGames().length);
    }
  }

  public start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.checkProcesses(), 3500);
    this.checkProcesses();
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isGameRunning(): boolean {
    return this.activeGameName !== null || gsiService.isLive();
  }

  public getActiveGameName(): string | null {
    return this.activeGameName;
  }

  public getActiveGameInfo(): {
    name: string;
    startTime: number;
    coverUrl?: string;
    isTool: boolean;
  } | null {
    if (!this.activeGameName) return null;
    return {
      name: this.activeGameName,
      startTime: this.activeGameStart,
      coverUrl: this.activeCoverUrl,
      isTool: this.activeIsTool
    };
  }

  private checkProcesses() {
    if (this.isChecking) return;
    this.isChecking = true;

    exec('tasklist /FO CSV /NH', { timeout: 4000 }, (err, stdout) => {
      this.isChecking = false;
      if (err || !stdout) return;

      const runningExes = new Set<string>();
      const lines = stdout.split('\r\n').filter(Boolean);
      for (const line of lines) {
        const match = line.match(/^"([^"]+)"/);
        if (match) {
          const exe = match[1].toLowerCase();
          if (!SYSTEM_EXES.has(exe)) {
            runningExes.add(exe);
          }
        }
      }

      const dotaRunning = runningExes.has('dota2.exe');
      const csRunning = runningExes.has('cs2.exe') || runningExes.has('csgo.exe');

      if (!dotaRunning && !csRunning && gsiService.isLive()) {
        gsiService.markInactive();
      }

      if (gsiService.isLive()) {
        const activeName = dotaRunning ? 'Dota 2' : (csRunning ? 'Counter-Strike 2' : 'GSI');
        if (this.activeGameName !== activeName) {
          this.activeGameName = activeName;
          this.activeGameStart = Date.now();
        }
        return;
      }

      const games = db.getGames();
      let foundGame: { name: string; coverUrl?: string } | null = null;

      for (const g of games) {
        if (!g.installed && !g.custom) continue;

        let exeBasename = '';
        if (g.executable) {
          exeBasename = path.basename(g.executable).toLowerCase();
        } else if (g.source === 'steam' && g.steamAppId) {
          if (g.steamAppId === 570) exeBasename = 'dota2.exe';
          else if (g.steamAppId === 730) exeBasename = 'cs2.exe';
          else if (g.steamAppId === 632810) exeBasename = 'soundpad.exe';
        }

        if (exeBasename && runningExes.has(exeBasename)) {
          const isDota = g.steamAppId === 570 || g.name.toLowerCase().includes('dota');
          const cover = isDota
            ? DOTA2_ICON_URL
            : (g.artwork?.cover && g.artwork.cover.startsWith('http'))
              ? g.artwork.cover
              : (g.artwork?.icon && g.artwork.icon.startsWith('http'))
                ? g.artwork.icon
                : undefined;
          foundGame = { name: g.name, coverUrl: cover };
          break;
        }

        const cleanName = g.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName.length >= 3 && runningExes.has(`${cleanName}.exe`)) {
          const isDota = g.steamAppId === 570 || g.name.toLowerCase().includes('dota');
          const cover = isDota
            ? DOTA2_ICON_URL
            : (g.artwork?.cover && g.artwork.cover.startsWith('http'))
              ? g.artwork.cover
              : (g.artwork?.icon && g.artwork.icon.startsWith('http'))
                ? g.artwork.icon
                : undefined;
          foundGame = { name: g.name, coverUrl: cover };
          break;
        }
      }

      if (!foundGame) {
        if (runningExes.has('soundpad.exe')) {
          foundGame = {
            name: 'Soundpad',
            coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/632810/header.jpg'
          };
        } else if (runningExes.has('dota2.exe')) {
          foundGame = {
            name: 'Dota 2',
            coverUrl: DOTA2_ICON_URL
          };
        } else if (runningExes.has('cs2.exe') || runningExes.has('csgo.exe')) {
          foundGame = {
            name: 'Counter-Strike 2',
            coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg'
          };
        }
      }

      if (foundGame) {
        const isTool = foundGame.name.toLowerCase().includes('soundpad');
        if (this.activeGameName !== foundGame.name) {
          if (this.activeGameName !== null) {
            this.recordGameSessionEnd(games);
          }
          this.activeGameName = foundGame.name;
          this.activeGameStart = Date.now();
          this.activeCoverUrl = foundGame.coverUrl;
          this.activeIsTool = isTool;
          if (!gsiService.isLive()) {
            discordRPC.setInGame(foundGame.name, this.activeGameStart, foundGame.coverUrl, isTool);
          }
          const matchedGame = games.find(g => g.name.toLowerCase() === foundGame.name.toLowerCase());
          if (this.win && !this.win.isDestroyed()) {
            if (matchedGame) {
              this.win.webContents.send('play:game:launched', { ...matchedGame, isRunning: true });
            }
            this.win.webContents.send('play:game:activeChange', {
              name: foundGame.name,
              startTime: this.activeGameStart,
              coverUrl: foundGame.coverUrl,
              gameId: matchedGame?.id,
              isTool
            });
          }
        }
      } else {
        if (this.activeGameName !== null) {
          this.recordGameSessionEnd(games);
          this.activeGameName = null;
          this.activeGameStart = 0;
          this.activeCoverUrl = undefined;
          this.activeIsTool = false;
          discordRPC.setIdle(games.length);
          if (this.win && !this.win.isDestroyed()) {
            this.win.webContents.send('play:game:activeChange', null);
          }
        }
      }
    });
  }

  private recordGameSessionEnd(games: any[]) {
    if (!this.activeGameName) return;
    const endTime = Date.now();
    const durationMinutes = Math.max(1, Math.round((endTime - (this.activeGameStart || (endTime - 60000))) / 60000));

    const matchedGame = games.find(g => g.name.toLowerCase() === this.activeGameName!.toLowerCase());
    const gameId = matchedGame ? matchedGame.id : `game_${this.activeGameName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const session: SessionRecord = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      gameId,
      gameName: this.activeGameName,
      startTime: this.activeGameStart || (endTime - 60000),
      endTime,
      durationMinutes
    };

    db.addSession(session);

    if (matchedGame) {
      matchedGame.playtimeMinutes = (matchedGame.playtimeMinutes || 0) + durationMinutes;
      matchedGame.lastPlayed = endTime;
      matchedGame.launchCount = (matchedGame.launchCount || 0) + 1;
      matchedGame.totalSessionTimeMinutes = (matchedGame.totalSessionTimeMinutes || 0) + durationMinutes;
      db.saveGame(matchedGame);
    }

    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send('play:game:stopped', { gameId, session });
      this.win.webContents.send('play:games:updated', db.getGames());
    }
  }
}

export const processWatcher = new ProcessWatcherService();
