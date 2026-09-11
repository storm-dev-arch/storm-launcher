import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import type { Game } from '../shared/types';
import { db } from './db';

const KNOWN_GAME_COVERS: Record<string, { cover: string; hero?: string; logo?: string }> = {
  'grand theft auto v': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/library_hero.jpg',
    logo: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/logo.png'
  },
  'gta v': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/library_hero.jpg',
    logo: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/logo.png'
  },
  'cyberpunk 2077': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_hero.jpg',
    logo: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/logo.png'
  },
  'the witcher 3: wild hunt': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_hero.jpg',
    logo: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/logo.png'
  },
  'the witcher 3': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/library_hero.jpg',
    logo: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/logo.png'
  },
  'red dead redemption 2': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/library_hero.jpg',
    logo: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/logo.png'
  },
  'death stranding': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/1190460/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/1190460/library_hero.jpg'
  },
  'control': {
    cover: 'https://cdn.akamai.steamstatic.com/steam/apps/870780/library_600x900_2x.jpg',
    hero: 'https://cdn.akamai.steamstatic.com/steam/apps/870780/library_hero.jpg'
  }
};

async function fetchSteamArtwork(title: string): Promise<{ cover?: string; hero?: string; logo?: string }> {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`;
    const data = await new Promise<any>((resolve) => {
      const req = https.get(url, { timeout: 3000 }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    });

    if (data && Array.isArray(data.items) && data.items.length > 0) {
      const appId = data.items[0].id;
      return {
        cover: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
        hero: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`,
        logo: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/logo.png`
      };
    }
  } catch (err) {}
  return {};
}

export class MultiLauncherScanner {
  public scanAll(): Game[] {
    const games: Game[] = [];

    try {
      const epicGames = this.scanEpicGames();
      games.push(...epicGames);
    } catch (e) {
      console.warn('Epic Games scan warning:', e);
    }

    try {
      const gogGames = this.scanGOGGames();
      games.push(...gogGames);
    } catch (e) {
      console.warn('GOG Galaxy scan warning:', e);
    }

    try {
      const otherGames = this.scanOtherLaunchers();
      games.push(...otherGames);
    } catch (e) {
      console.warn('Other launchers scan warning:', e);
    }

    return games;
  }

  public async scanAllAsync(): Promise<Game[]> {
    const games = this.scanAll();

    for (const g of games) {
      if (!g.artwork.cover) {
        const norm = g.name.toLowerCase().trim();
        if (KNOWN_GAME_COVERS[norm]) {
          g.artwork = { ...g.artwork, ...KNOWN_GAME_COVERS[norm] };
        } else {
          try {
            const art = await fetchSteamArtwork(g.name);
            if (art.cover) {
              g.artwork = { ...g.artwork, ...art };
            }
          } catch {}
        }
      }
    }

    return games;
  }

  private scanEpicGames(): Game[] {
    const epicGames: Game[] = [];
    const manifestsDir = path.join(
      process.env.ProgramData || 'C:\\ProgramData',
      'Epic',
      'EpicGamesLauncher',
      'Data',
      'Manifests'
    );

    if (!fs.existsSync(manifestsDir)) return epicGames;

    const files = fs.readdirSync(manifestsDir);
    for (const f of files) {
      if (!f.endsWith('.item')) continue;
      try {
        const fullPath = path.join(manifestsDir, f);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

        if (!data.DisplayName || !data.InstallLocation) continue;

        if (
          data.DisplayName.includes('Unreal Engine') ||
          data.DisplayName.includes('DirectX') ||
          data.DisplayName.includes('Prerequisites')
        ) {
          continue;
        }

        const installPath = path.normalize(data.InstallLocation);
        if (!fs.existsSync(installPath)) continue;

        const exePath = data.LaunchExecutable
          ? path.join(installPath, data.LaunchExecutable)
          : undefined;

        const appName = data.AppName || data.CatalogItemId || f.replace('.item', '');

        epicGames.push({
          id: `epic_${appName}`,
          source: 'epic',
          name: data.DisplayName,
          epicAppId: appName,
          installPath,
          executable: exePath && fs.existsSync(exePath) ? exePath : undefined,
          launchCommand: `com.epicgames.launcher://apps/${appName}?action=launch&silent=true`,
          installed: true,
          favorite: false,
          playtimeMinutes: 0,
          dateAdded: Date.now(),
          custom: false,
          artwork: {
            icon: undefined,
            cover: undefined
          },
          collections: [],
          launchCount: 0,
          totalSessionTimeMinutes: 0
        });
      } catch (err) {
        console.error('Error reading Epic manifest:', f, err);
      }
    }

    return epicGames;
  }

  private scanGOGGames(): Game[] {
    const gogGames: Game[] = [];
    const foundPaths = new Set<string>();

    try {
      const regOutput = execSync(
        'reg query "HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games" /s 2>nul',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      );

      const blocks = regOutput.split(/\r?\n\r?\n/);
      for (const block of blocks) {
        const nameMatch = block.match(/GAMENAME\s+REG_SZ\s+(.+)/i);
        const pathMatch = block.match(/PATH\s+REG_SZ\s+(.+)/i);
        const exeMatch = block.match(/EXE\s+REG_SZ\s+(.+)/i);
        const idMatch = block.match(/GAMEID\s+REG_SZ\s+(\d+)/i);

        if (nameMatch && pathMatch) {
          const gameName = nameMatch[1].trim();
          const gamePath = path.normalize(pathMatch[1].trim());
          const gameId = idMatch ? idMatch[1].trim() : String(Date.now());
          const exeFile = exeMatch ? exeMatch[1].trim() : '';
          const fullExe = exeFile ? path.join(gamePath, exeFile) : undefined;

          if (fs.existsSync(gamePath) && !foundPaths.has(gamePath.toLowerCase())) {
            foundPaths.add(gamePath.toLowerCase());
            gogGames.push({
              id: `gog_${gameId}`,
              source: 'gog',
              name: gameName,
              gogAppId: gameId,
              installPath: gamePath,
              executable: fullExe && fs.existsSync(fullExe) ? fullExe : undefined,
              launchCommand: fullExe ? `"${fullExe}"` : undefined,
              installed: true,
              favorite: false,
              playtimeMinutes: 0,
              dateAdded: Date.now(),
              custom: false,
              artwork: {},
              collections: [],
              launchCount: 0,
              totalSessionTimeMinutes: 0
            });
          }
        }
      }
    } catch {}

    const defaultGogDirs = [
      'C:\\Program Files (x86)\\GOG Galaxy\\Games',
      'C:\\GOG Games',
      'D:\\GOG Games',
      'E:\\GOG Games'
    ];

    for (const gogDir of defaultGogDirs) {
      if (!fs.existsSync(gogDir)) continue;
      try {
        const subDirs = fs.readdirSync(gogDir, { withFileTypes: true });
        for (const d of subDirs) {
          if (!d.isDirectory()) continue;
          const gameFolder = path.join(gogDir, d.name);
          if (foundPaths.has(gameFolder.toLowerCase())) continue;

          const files = fs.readdirSync(gameFolder);
          const infoFile = files.find(f => f.startsWith('goggame-') && f.endsWith('.info'));
          if (infoFile) {
            try {
              const info = JSON.parse(fs.readFileSync(path.join(gameFolder, infoFile), 'utf8'));
              const gogId = info.gameId || d.name;
              const gogName = info.name || d.name;
              let exePath: string | undefined = undefined;

              if (info.playTasks && info.playTasks[0]?.path) {
                exePath = path.join(gameFolder, info.playTasks[0].path);
              }

              foundPaths.add(gameFolder.toLowerCase());
              gogGames.push({
                id: `gog_${gogId}`,
                source: 'gog',
                name: gogName,
                gogAppId: String(gogId),
                installPath: gameFolder,
                executable: exePath && fs.existsSync(exePath) ? exePath : undefined,
                launchCommand: exePath ? `"${exePath}"` : undefined,
                installed: true,
                favorite: false,
                playtimeMinutes: 0,
                dateAdded: Date.now(),
                custom: false,
                artwork: {},
                collections: [],
                launchCount: 0,
                totalSessionTimeMinutes: 0
              });
            } catch {}
          }
        }
      } catch {}
    }

    return gogGames;
  }

  private scanOtherLaunchers(): Game[] {
    const games: Game[] = [];

    const ubiDir = 'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games';
    if (fs.existsSync(ubiDir)) {
      try {
        const dirs = fs.readdirSync(ubiDir, { withFileTypes: true });
        for (const d of dirs) {
          if (!d.isDirectory()) continue;
          const fullPath = path.join(ubiDir, d.name);
          const files = fs.readdirSync(fullPath);
          const exe = files.find(f => f.toLowerCase().endsWith('.exe') && !f.toLowerCase().includes('unins'));
          if (exe) {
            games.push({
              id: `ubisoft_${d.name.toLowerCase().replace(/\s+/g, '_')}`,
              source: 'ubisoft',
              name: d.name,
              installPath: fullPath,
              executable: path.join(fullPath, exe),
              installed: true,
              favorite: false,
              playtimeMinutes: 0,
              dateAdded: Date.now(),
              custom: false,
              artwork: {},
              collections: [],
              launchCount: 0,
              totalSessionTimeMinutes: 0
            });
          }
        }
      } catch {}
    }

    return games;
  }
}

export const multiLauncherScanner = new MultiLauncherScanner();
