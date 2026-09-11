import fs from 'fs';
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import os from 'os';
import { db } from './db';
import { steamScanner } from './steamScanner';
import { gameLauncher } from './gameLauncher';
import { customScanner } from './customScanner';
import { createWindowsDesktopShortcut } from './shortcuts';
import { registerPlayProtocol } from './protocol';
import { discordRPC } from './discordRPC';
import { multiLauncherScanner } from './multiLauncherScanner';
import { deepDiskScanner } from './deepDiskScanner';
import { steamGridDBService } from './steamGridDB';
import { achievementEngine } from './achievementEngine';
import { screenshotManager } from './screenshotManager';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const settings = db.getSettings();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    show: false,
    backgroundColor: '#050505',
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Safe play:// protocol for cached artwork, screenshots, and local streams
  registerPlayProtocol(db.getCacheDir());

  // Load URL or build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    // Initialize Discord RPC if enabled
    if (settings.discordRPC !== false) {
      discordRPC.setIdle(db.getGames().length);
    } else {
      discordRPC.setEnabled(false);
    }

    // Auto-scan Steam & Multi-launchers (Epic Games, GOG Galaxy) on startup (non-blocking)
    steamScanner.scan((progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('play:scanner:progress', progress);
      }
    }).then(async () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('play:games:updated', db.getGames());
      }
      try {
        const extraGames = await multiLauncherScanner.scanAllAsync();
        if (extraGames.length > 0) {
          db.upsertGames(extraGames);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('play:games:updated', db.getGames());
          }
        }
      } catch (e) {
        console.warn('Startup multi-launcher scan:', e);
      }
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  discordRPC.clearActivity();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ==========================================
// IPC HANDLERS
// ==========================================

// 1. Games Management
ipcMain.handle('play:games:getAll', () => db.getGames());
ipcMain.handle('play:games:getById', (_, id) => db.getGame(id) || null);
ipcMain.handle('play:games:toggleFavorite', (_, id) => db.toggleFavorite(id));
ipcMain.handle('play:games:addCustom', (_, gameData) => {
  const newGame = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    source: gameData.source || 'custom',
    name: gameData.name || 'Untitled Game',
    installPath: gameData.installPath || '',
    executable: gameData.executable || '',
    launchCommand: gameData.launchCommand || (gameData.executable ? `"${gameData.executable}"` : ''),
    arguments: gameData.arguments || '',
    workingDirectory: gameData.workingDirectory || (gameData.executable ? path.dirname(gameData.executable) : ''),
    installed: true,
    favorite: false,
    playtimeMinutes: 0,
    dateAdded: Date.now(),
    custom: true,
    artwork: gameData.artwork || {},
    collections: gameData.collections || [],
    launchCount: 0,
    totalSessionTimeMinutes: 0
  };
  return db.saveGame(newGame);
});
ipcMain.handle('play:games:update', (_, id, partial) => {
  const g = db.getGame(id);
  if (!g) throw new Error('Game not found');
  const updated = { ...g, ...partial };
  return db.saveGame(updated);
});
ipcMain.handle('play:games:delete', (_, id) => db.deleteGame(id));
ipcMain.handle('play:games:launch', (_, id) => gameLauncher.launchGame(id, mainWindow));
ipcMain.handle('play:games:openInstallFolder', (_, id) => {
  const g = db.getGame(id);
  if (g && g.installPath && fs.existsSync(g.installPath)) {
    shell.openPath(g.installPath);
  }
});
ipcMain.handle('play:games:createDesktopShortcut', (_, id) => {
  const g = db.getGame(id);
  if (!g) return { success: false, error: 'Game not found' };
  return createWindowsDesktopShortcut(g);
});

// 2. Scanner & Multi-Launchers
ipcMain.handle('play:scanner:syncAll', async (_, force) => {
  // 1. Scan Steam
  const steamResult = await steamScanner.scan((prog) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('play:scanner:progress', prog);
    }
  }, force);

  // 2. Scan Multi-Launchers (Epic Games, GOG Galaxy, Ubisoft)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('play:scanner:progress', {
      stage: 'reading_games',
      message: 'Scanning Epic Games Store & GOG Galaxy...',
      librariesFound: steamResult.progress?.librariesFound || 0,
      gamesDetected: steamResult.games.length,
      gamesInstalled: steamResult.games.filter(g => g.installed).length
    });
  }

  const multiGames = await multiLauncherScanner.scanAllAsync();

  // 3. Upsert both sets into DB
  const allScanned = [...steamResult.games, ...multiGames];
  db.upsertGames(allScanned);

  const allFinal = db.getGames();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('play:games:updated', allFinal);
    mainWindow.webContents.send('play:scanner:progress', {
      stage: 'ready',
      message: `Complete: ${allFinal.length} games across all platforms`,
      librariesFound: steamResult.progress?.librariesFound || 0,
      gamesDetected: allFinal.length,
      gamesInstalled: allFinal.filter(g => g.installed).length
    });
  }

  return {
    games: allFinal,
    progress: {
      stage: 'ready',
      message: `Discovered ${allFinal.length} games`,
      librariesFound: steamResult.progress?.librariesFound || 0,
      gamesDetected: allFinal.length,
      gamesInstalled: allFinal.filter(g => g.installed).length
    }
  };
});

ipcMain.handle('play:scanner:scanSteam', async (_, force) => {
  return steamScanner.scan((prog) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('play:scanner:progress', prog);
    }
  }, force);
});

ipcMain.handle('play:scanner:scanMultiLaunchers', async () => {
  const games = await multiLauncherScanner.scanAllAsync();
  db.upsertGames(games);
  return db.getGames();
});

ipcMain.handle('play:scanner:deepScanDisks', async () => {
  return deepDiskScanner.scanDisks((msg) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('play:scanner:progress', {
        stage: 'reading_games',
        message: msg,
        librariesFound: 0,
        gamesDetected: 0,
        gamesInstalled: 0
      });
    }
  });
});

ipcMain.handle('play:scanner:scanFolderForExecutables', (_, folderPath) => customScanner.scanFolder(folderPath));
ipcMain.handle('play:scanner:selectFolder', async () => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return res.canceled ? null : res.filePaths[0];
});
ipcMain.handle('play:scanner:selectFile', async (_, filters) => {
  if (!mainWindow) return null;
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'Executable Files', extensions: ['exe'] }]
  });
  return res.canceled ? null : res.filePaths[0];
});
ipcMain.handle('play:scanner:getSteamStatus', () => steamScanner.getSteamStatus());

// 3. SteamGridDB Integration
ipcMain.handle('play:steamgrid:search', (_, query, type) => steamGridDBService.searchArtwork(query, type));
ipcMain.handle('play:steamgrid:apply', (_, gameId, type, url) => steamGridDBService.applyArtwork(gameId, type, url));

// 4. Steam Achievements
ipcMain.handle('play:achievements:get', (_, steamAppId) => achievementEngine.getAchievements(steamAppId));

// 5. Steam Screenshots
ipcMain.handle('play:screenshots:get', (_, steamAppId) => screenshotManager.getScreenshotsForGame(steamAppId));
ipcMain.handle('play:screenshots:open', (_, steamAppId) => screenshotManager.openScreenshotsFolder(steamAppId));

// 6. Discord RPC
ipcMain.handle('play:discord:updateStatus', (_, activity) => {
  discordRPC.setActivity(activity);
});

// 7. Sessions & Stats
ipcMain.handle('play:sessions:getAll', () => db.getSessions());
ipcMain.handle('play:sessions:getStats', () => db.getStats());

// 8. Collections
ipcMain.handle('play:collections:getAll', () => db.getCollections());
ipcMain.handle('play:collections:create', (_, name, color) => {
  const col = {
    id: `col_${Date.now()}`,
    name,
    color: color || '#38BDF8',
    createdAt: Date.now(),
    gameIds: []
  };
  return db.saveCollection(col);
});
ipcMain.handle('play:collections:update', (_, id, partial) => {
  const list = db.getCollections();
  const c = list.find(item => item.id === id);
  if (!c) throw new Error('Collection not found');
  return db.saveCollection({ ...c, ...partial });
});
ipcMain.handle('play:collections:delete', (_, id) => db.deleteCollection(id));
ipcMain.handle('play:collections:addGame', (_, colId, gameId) => {
  const list = db.getCollections();
  const c = list.find(item => item.id === colId);
  if (!c) return false;
  if (!c.gameIds.includes(gameId)) {
    c.gameIds.push(gameId);
    db.saveCollection(c);
  }
  const g = db.getGame(gameId);
  if (g) {
    if (!g.collections) g.collections = [];
    if (!g.collections.includes(colId)) {
      g.collections.push(colId);
      db.saveGame(g);
    }
  }
  return true;
});
ipcMain.handle('play:collections:removeGame', (_, colId, gameId) => {
  const list = db.getCollections();
  const c = list.find(item => item.id === colId);
  if (!c) return false;
  c.gameIds = c.gameIds.filter(id => id !== gameId);
  db.saveCollection(c);
  const g = db.getGame(gameId);
  if (g && g.collections) {
    g.collections = g.collections.filter(id => id !== colId);
    db.saveGame(g);
  }
  return true;
});

// 9. Settings
ipcMain.handle('play:settings:get', () => db.getSettings());
ipcMain.handle('play:settings:update', (_, partial) => {
  if (partial.discordRPC !== undefined) {
    discordRPC.setEnabled(partial.discordRPC);
  }
  return db.saveSettings(partial);
});

// 10. System
ipcMain.on('play:system:minimize', () => mainWindow?.minimize());
ipcMain.on('play:system:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on('play:system:close', () => mainWindow?.close());
ipcMain.handle('play:system:isMaximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.handle('play:system:openExternal', (_, url) => shell.openExternal(url));
ipcMain.handle('play:system:getPCSpecs', async () => {
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU';
  const totalRamGb = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
  return {
    cpu: cpuModel,
    ram: `${totalRamGb} GB RAM`,
    os: `${os.type()} ${os.release()}`
  };
});
