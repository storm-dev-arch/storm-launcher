import { exec } from 'child_process';
import path from 'path';
import { db } from './db';
import { discordRPC } from './discordRPC';
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

  private checkProcesses() {
    if (this.isChecking) return;
    this.isChecking = true;

    exec('tasklist /FO CSV /NH', { timeout: 4000 }, (err, stdout) => {
      this.isChecking = false;
      if (err || !stdout) return;

      if (gsiService.isLive()) {
        this.activeGameName = 'GSI';
        return;
      }

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
          const cover = (g.artwork?.cover && g.artwork.cover.startsWith('http'))
            ? g.artwork.cover
            : (g.artwork?.icon && g.artwork.icon.startsWith('http'))
              ? g.artwork.icon
              : undefined;
          foundGame = { name: g.name, coverUrl: cover };
          break;
        }

        const cleanName = g.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName.length >= 3 && runningExes.has(`${cleanName}.exe`)) {
          const cover = (g.artwork?.cover && g.artwork.cover.startsWith('http'))
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
            coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg'
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
          this.activeGameName = foundGame.name;
          this.activeGameStart = Date.now();
          this.activeCoverUrl = foundGame.coverUrl;
          this.activeIsTool = isTool;
          discordRPC.setInGame(foundGame.name, this.activeGameStart, foundGame.coverUrl, isTool);
        }
      } else {
        if (this.activeGameName !== null) {
          this.activeGameName = null;
          this.activeGameStart = 0;
          this.activeCoverUrl = undefined;
          this.activeIsTool = false;
          discordRPC.setIdle(games.length);
        }
      }
    });
  }
}

export const processWatcher = new ProcessWatcherService();
