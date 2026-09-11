import path from 'path';
import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';
import type { Game, ScannerProgress } from '../shared/types';
import { db } from './db';

interface SteamAppCacheEntry {
  name: string;
  type?: string;
}

// Fetch helper with timeout
async function fetchSteamAppBasic(appId: number): Promise<SteamAppCacheEntry | null> {
  return new Promise((resolve) => {
    const req = https.get(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`,
      { timeout: 2500 },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json[appId] && json[appId].success && json[appId].data) {
              const d = json[appId].data;
              resolve({ name: d.name, type: d.type });
              return;
            }
          } catch {}
          resolve(null);
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Batch resolver with concurrency limit
async function resolveSteamAppNames(
  appIds: number[],
  cache: Record<string, SteamAppCacheEntry>,
  cacheFile: string,
  onProgressUpdate?: (resolvedCount: number) => void
): Promise<void> {
  const missing = appIds.filter(id => !cache[id] || !cache[id].name);
  if (missing.length === 0) return;

  const concurrency = 8;
  let index = 0;
  let dirty = false;

  async function worker() {
    while (index < missing.length) {
      const id = missing[index++];
      const info = await fetchSteamAppBasic(id);
      if (info && info.name) {
        cache[id] = info;
        dirty = true;
      }
      onProgressUpdate?.(Object.keys(cache).length);
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, missing.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  if (dirty) {
    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
    } catch {}
  }
}

// Valve VDF / ACF Parser
export function parseVDF(text: string): any {
  const lines = text.split(/\r?\n/);
  const root: any = {};
  const stack: any[] = [root];

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) continue;

    if (line === '{') {
      continue;
    } else if (line === '}') {
      if (stack.length > 1) stack.pop();
    } else {
      // Matches "key" "value" or "key" (followed by object)
      const matches = line.match(/"([^"]+)"(?:\s+"([^"]*)")?/);
      if (matches) {
        const key = matches[1];
        const val = matches[2];
        const current = stack[stack.length - 1];

        if (val !== undefined) {
          current[key] = val;
        } else {
          const newObj: any = {};
          current[key] = newObj;
          stack.push(newObj);
        }
      }
    }
  }

  return root;
}

export class SteamScannerService {
  private detectedSteamPath: string | null = null;
  private detectedLibraries: string[] = [];

  constructor() {
    this.detectSteam();
  }

  public detectSteam(): string | null {
    if (this.detectedSteamPath && fs.existsSync(this.detectedSteamPath)) {
      return this.detectedSteamPath;
    }

    // 1. Check Windows Registry via PowerShell
    try {
      const regCmd = 'Get-ItemProperty -Path "HKCU:\\Software\\Valve\\Steam", "HKLM:\\Software\\Valve\\Steam", "HKLM:\\Software\\WOW6432Node\\Valve\\Steam" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty SteamPath -First 1';
      const out = execSync(`powershell -NoProfile -Command "${regCmd}"`, { encoding: 'utf8', timeout: 3000 }).trim();
      if (out && fs.existsSync(out)) {
        this.detectedSteamPath = path.normalize(out);
        return this.detectedSteamPath;
      }
    } catch {}

    // 2. Check standard installation folders
    const standardPaths = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam',
      'D:\\Steam',
      'E:\\Steam',
      'D:\\SteamLibrary',
      'E:\\SteamLibrary'
    ];

    for (const p of standardPaths) {
      if (fs.existsSync(path.join(p, 'steam.exe'))) {
        this.detectedSteamPath = p;
        return this.detectedSteamPath;
      }
    }

    return null;
  }

  public getSteamStatus(): { installed: boolean; path?: string; libraries: string[] } {
    const steamPath = this.detectSteam();
    return {
      installed: !!steamPath,
      path: steamPath || undefined,
      libraries: this.detectedLibraries
    };
  }

  public async scan(
    onProgress?: (p: ScannerProgress) => void,
    force = false
  ): Promise<{ games: Game[]; progress: ScannerProgress }> {
    const progress: ScannerProgress = {
      stage: 'detecting',
      message: 'Detecting Steam installation...',
      librariesFound: 0,
      gamesDetected: 0,
      gamesInstalled: 0
    };

    onProgress?.(progress);

    const steamPath = this.detectSteam();
    if (!steamPath) {
      progress.stage = 'ready';
      progress.message = 'Steam installation was not detected on this computer.';
      onProgress?.(progress);
      return { games: [], progress };
    }

    // Step 2: Detect all libraries from libraryfolders.vdf
    progress.stage = 'libraries';
    progress.message = 'Reading Steam libraries configuration...';
    onProgress?.(progress);

    const libraries: string[] = [path.normalize(steamPath)];
    const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');

    if (fs.existsSync(vdfPath)) {
      try {
        const vdfContent = fs.readFileSync(vdfPath, 'utf8');
        const parsed = parseVDF(vdfContent);
        const foldersObj = parsed.libraryfolders || parsed;

        for (const k of Object.keys(foldersObj)) {
          const item = foldersObj[k];
          if (item && typeof item === 'object' && item.path) {
            const normalized = path.normalize(item.path);
            const isAlreadyAdded = libraries.some(l => l.toLowerCase() === normalized.toLowerCase());
            if (fs.existsSync(normalized) && !isAlreadyAdded) {
              libraries.push(normalized);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing libraryfolders.vdf:', e);
      }
    }

    this.detectedLibraries = libraries;
    progress.librariesFound = libraries.length;
    progress.message = `Found ${libraries.length} Steam ${libraries.length === 1 ? 'library' : 'libraries'}. Loading installed manifests...`;
    onProgress?.(progress);

    // Step 3: Load real playtime and owned app IDs from userdata/*/config/localconfig.vdf
    const playtimeMap = new Map<number, { playtime: number; lastPlayed?: number }>();
    const ownedAppsMap = new Map<number, { playtime: number; lastPlayed?: number }>();
    const userdataDir = path.join(steamPath, 'userdata');

    if (fs.existsSync(userdataDir)) {
      try {
        const userDirs = fs.readdirSync(userdataDir, { withFileTypes: true })
          .filter(d => d.isDirectory() && !isNaN(Number(d.name)));

        for (const userDir of userDirs) {
          const userDirPath = path.join(userdataDir, userDir.name);
          const localConfigPath = path.join(userDirPath, 'config', 'localconfig.vdf');
          if (fs.existsSync(localConfigPath)) {
            const text = fs.readFileSync(localConfigPath, 'utf8');
            // Extract apps inside Apps
            const appRegex = /"(\d{2,8})"\s*\{([^}]*?)\}/gs;
            let m;
            while ((m = appRegex.exec(text)) !== null) {
              const appId = Number(m[1]);
              if (appId < 10 || appId > 40000000) continue;
              // Skip known non-game utilities/runtimes
              if ([760, 2371090, 228980, 228983, 228985, 228986, 228987, 228988, 228989, 228990, 229000, 229001, 229002].includes(appId)) continue;

              const block = m[2];
              const ptMatch = block.match(/"Playtime"\s*"(\d+)"/);
              const lpMatch = block.match(/"LastPlayed"\s*"(\d+)"/);
              const mins = ptMatch ? Number(ptMatch[1]) : 0;
              const lastP = lpMatch ? Number(lpMatch[1]) * 1000 : undefined;

              const prev = playtimeMap.get(appId);
              if (!prev || mins > prev.playtime) {
                playtimeMap.set(appId, { playtime: mins, lastPlayed: lastP });
                ownedAppsMap.set(appId, { playtime: mins, lastPlayed: lastP });
              }
            }
          }

          // Also check user librarycache json files
          const libCacheDir = path.join(userDirPath, 'config', 'librarycache');
          if (fs.existsSync(libCacheDir)) {
            for (const f of fs.readdirSync(libCacheDir)) {
              if (f.endsWith('.json')) {
                const id = Number(f.replace('.json', ''));
                if (id >= 10 && id <= 40000000 && !ownedAppsMap.has(id)) {
                  ownedAppsMap.set(id, { playtime: 0, lastPlayed: undefined });
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error scanning userdata:', e);
      }
    }

    // Step 4: Scan each library for appmanifest_*.acf (Installed games)
    progress.stage = 'reading_games';
    const foundGamesMap = new Map<string, Game>();
    const cacheDir = db.getCacheDir();

    for (const lib of libraries) {
      const steamAppsDir = path.join(lib, 'steamapps');
      if (!fs.existsSync(steamAppsDir)) continue;

      const files = fs.readdirSync(steamAppsDir);
      for (const f of files) {
        if (f.startsWith('appmanifest_') && f.endsWith('.acf')) {
          try {
            const manifestPath = path.join(steamAppsDir, f);
            const content = fs.readFileSync(manifestPath, 'utf8');
            const parsed = parseVDF(content);
            const appState = parsed.AppState || parsed;

            if (!appState || !appState.appid) continue;

            const appId = Number(appState.appid);
            const gameName = appState.name || `Steam App ${appId}`;
            const installDirName = appState.installdir || '';
            const fullInstallPath = path.join(steamAppsDir, 'common', installDirName);
            const sizeOnDisk = appState.SizeOnDisk ? Number(appState.SizeOnDisk) : undefined;
            const lastUpdated = appState.LastUpdated ? Number(appState.LastUpdated) * 1000 : Date.now();
            const lastPlayedRaw = appState.LastPlayed ? Number(appState.LastPlayed) * 1000 : undefined;

            // Skip internal Steam runtimes / redistributables to keep game library clean
            if (
              gameName.toLowerCase().includes('steamworks common') ||
              gameName.toLowerCase().includes('steam linux runtime') ||
              gameName.toLowerCase().includes('proton')
            ) {
              continue;
            }

            const stateFlags = Number(appState.StateFlags) || 0;
            const isInstalled = fs.existsSync(fullInstallPath) && (stateFlags === 4 || stateFlags === 6 || stateFlags === 1026);

            // Playtime lookup
            const ptData = playtimeMap.get(appId);
            const playtimeMinutes = ptData?.playtime || 0;
            const lastPlayed = ptData?.lastPlayed || (lastPlayedRaw && lastPlayedRaw > 0 ? lastPlayedRaw : undefined);

            // Locate local Steam artwork if available
            const localArtDir = path.join(steamPath, 'appcache', 'librarycache', String(appId));
            let coverUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`;
            let heroUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`;
            let logoUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/logo.png`;

            // Check if local cache exists
            if (fs.existsSync(localArtDir)) {
              const localCover = path.join(localArtDir, 'library_600x900.jpg');
              const localHero = path.join(localArtDir, 'library_hero.jpg');
              const localLogo = path.join(localArtDir, 'logo.png');

              if (fs.existsSync(localCover)) coverUrl = `play://local/${localCover.replace(/\\/g, '/')}`;
              if (fs.existsSync(localHero)) heroUrl = `play://local/${localHero.replace(/\\/g, '/')}`;
              if (fs.existsSync(localLogo)) logoUrl = `play://local/${localLogo.replace(/\\/g, '/')}`;
            }

            // Find main executable in common/<installdir>
            let executablePath: string | undefined = undefined;
            if (fs.existsSync(fullInstallPath)) {
              try {
                const subFiles = fs.readdirSync(fullInstallPath);
                const exeCandidates = subFiles.filter(sf => sf.toLowerCase().endsWith('.exe') && !sf.toLowerCase().includes('unins') && !sf.toLowerCase().includes('crash'));
                if (exeCandidates.length > 0) {
                  executablePath = path.join(fullInstallPath, exeCandidates[0]);
                }
              } catch {}
            }

            const gameRecord: Game = {
              id: `steam_${appId}`,
              source: 'steam',
              name: gameName,
              steamAppId: appId,
              installPath: fullInstallPath,
              executable: executablePath,
              launchCommand: `steam://rungameid/${appId}`,
              installed: isInstalled,
              favorite: false,
              playtimeMinutes,
              lastPlayed,
              dateAdded: lastUpdated,
              custom: false,
              artwork: {
                cover: coverUrl,
                hero: heroUrl,
                logo: logoUrl,
                icon: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
              },
              collections: [],
              launchCount: 0,
              totalSessionTimeMinutes: 0,
              sizeOnDisk
            };

            const existing = foundGamesMap.get(gameRecord.id);
            if (existing) {
              if (!existing.installed && isInstalled) {
                foundGamesMap.set(gameRecord.id, gameRecord);
              }
            } else {
              foundGamesMap.set(gameRecord.id, gameRecord);
            }

            progress.gamesDetected = foundGamesMap.size;
            if (isInstalled) progress.gamesInstalled = Array.from(foundGamesMap.values()).filter(g => g.installed).length;

            progress.message = `Detected: ${gameName} (${foundGamesMap.size} games)...`;
            onProgress?.(progress);
          } catch (e) {
            console.error(`Failed reading ${f}:`, e);
          }
        }
      }
    }

    // Step 5: Process uninstalled games from user's Steam library
    progress.stage = 'reading_games';
    progress.message = 'Loading uninstalled games from Steam library...';
    onProgress?.(progress);

    const nameCacheFile = path.join(cacheDir, 'steam_app_names.json');
    let nameCache: Record<string, SteamAppCacheEntry> = {};
    if (fs.existsSync(nameCacheFile)) {
      try {
        nameCache = JSON.parse(fs.readFileSync(nameCacheFile, 'utf8'));
      } catch {}
    }

    // Seed nameCache with games we already know from DB or installed scan
    for (const g of foundGamesMap.values()) {
      if (g.steamAppId && g.name && !g.name.startsWith('Steam App ')) {
        nameCache[String(g.steamAppId)] = { name: g.name, type: 'game' };
      }
    }
    for (const g of db.getGames()) {
      if (g.steamAppId && g.name && !g.name.startsWith('Steam App ')) {
        if (!nameCache[String(g.steamAppId)]) {
          nameCache[String(g.steamAppId)] = { name: g.name, type: 'game' };
        }
      }
    }

    // Determine missing AppIDs to resolve
    const uninstalledAppIds: number[] = [];
    for (const [appId] of ownedAppsMap) {
      if (!foundGamesMap.has(`steam_${appId}`)) {
        uninstalledAppIds.push(appId);
      }
    }

    if (uninstalledAppIds.length > 0) {
      // Resolve any missing app names in parallel
      await resolveSteamAppNames(uninstalledAppIds, nameCache, nameCacheFile, (count) => {
        progress.message = `Resolving Steam library games (${count} cached)...`;
        onProgress?.(progress);
      });

      for (const appId of uninstalledAppIds) {
        const cacheEntry = nameCache[String(appId)];
        const appInfo = ownedAppsMap.get(appId);

        // Skip non-game DLC packages unless explicitly known as a game/app
        if (cacheEntry?.type && ['dlc', 'advertising', 'series', 'episode'].includes(cacheEntry.type.toLowerCase())) {
          continue;
        }

        // If no name resolved and no local artwork / playtime, skip obscure DLC/tools
        const localArtDir = path.join(steamPath, 'appcache', 'librarycache', String(appId));
        const hasLocalCache = fs.existsSync(localArtDir);
        const hasPlaytime = (appInfo?.playtime || 0) > 0;

        if (!cacheEntry?.name && !hasLocalCache && !hasPlaytime) {
          continue;
        }

        const gameName = cacheEntry?.name || `Steam App ${appId}`;

        // Skip internal runtimes
        if (
          gameName.toLowerCase().includes('steamworks common') ||
          gameName.toLowerCase().includes('steam linux runtime') ||
          gameName.toLowerCase().includes('proton')
        ) {
          continue;
        }

        let coverUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`;
        let heroUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`;
        let logoUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/logo.png`;

        if (hasLocalCache) {
          const localCover = path.join(localArtDir, 'library_600x900.jpg');
          const localHero = path.join(localArtDir, 'library_hero.jpg');
          const localLogo = path.join(localArtDir, 'logo.png');

          if (fs.existsSync(localCover)) coverUrl = `play://local/${localCover.replace(/\\/g, '/')}`;
          if (fs.existsSync(localHero)) heroUrl = `play://local/${localHero.replace(/\\/g, '/')}`;
          if (fs.existsSync(localLogo)) logoUrl = `play://local/${localLogo.replace(/\\/g, '/')}`;
        }

        const gameRecord: Game = {
          id: `steam_${appId}`,
          source: 'steam',
          name: gameName,
          steamAppId: appId,
          installPath: '',
          launchCommand: `steam://install/${appId}`,
          installed: false,
          favorite: false,
          playtimeMinutes: appInfo?.playtime || 0,
          lastPlayed: appInfo?.lastPlayed,
          dateAdded: appInfo?.lastPlayed || Date.now(),
          custom: false,
          artwork: {
            cover: coverUrl,
            hero: heroUrl,
            logo: logoUrl,
            icon: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
          },
          collections: [],
          launchCount: 0,
          totalSessionTimeMinutes: 0
        };

        foundGamesMap.set(gameRecord.id, gameRecord);
      }
    }

    const uniqueGames = Array.from(foundGamesMap.values());
    progress.gamesDetected = uniqueGames.length;
    progress.gamesInstalled = uniqueGames.filter(g => g.installed).length;

    // Step 6: Save games to database
    db.upsertGames(uniqueGames);

    progress.stage = 'ready';
    progress.message = `Scan complete! ${uniqueGames.length} Steam games loaded (${progress.gamesInstalled} installed).`;
    onProgress?.(progress);

    return { games: uniqueGames, progress };

  }
}

export const steamScanner = new SteamScannerService();
