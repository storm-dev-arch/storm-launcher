import fs from 'fs';
import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, globalShortcut } from 'electron';
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
import { gsiService } from './gsiService';
import { processWatcher } from './processWatcher';
import { inspectorService } from './inspectorService';

let mainWindow: BrowserWindow | null = null;
let miniWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createMiniWindow() {
  miniWindow = new BrowserWindow({
    width: 360,
    height: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  if (process.env.VITE_DEV_SERVER_URL) {
    miniWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#mini`);
  } else {
    miniWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'mini' });
  }

  miniWindow.on('blur', () => {
    if (miniWindow && !miniWindow.isDestroyed()) {
      miniWindow.setFocusable(false);
    }
  });
  
  miniWindow.on('focus', () => {
    if (miniWindow && !miniWindow.isDestroyed()) {
      miniWindow.setFocusable(true);
    }
  });

  miniWindow.on('closed', () => {
    miniWindow = null;
  });
}

function toggleMiniWindow() {
  if (!miniWindow || miniWindow.isDestroyed()) {
    createMiniWindow();
  }
  if (miniWindow && !miniWindow.isDestroyed()) {
    if (miniWindow.isVisible()) {
      miniWindow.hide();
    } else {
      miniWindow.setFocusable(true);
      miniWindow.show();
    }
  }
}

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
      sandbox: false,
      webSecurity: process.env.NODE_ENV === 'production',
      backgroundThrottling: false
    }
  });

  registerPlayProtocol(db.getCacheDir());

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    if (settings.discordRPC === false) {
      discordRPC.setEnabled(false);
    }

    gsiService.setWindow(mainWindow);
    gsiService.startServer();
    const steamStatus = steamScanner.getSteamStatus();
    if (steamStatus.libraries && steamStatus.libraries.length > 0) {
      gsiService.installGSIConfigs(steamStatus.libraries);
    }

    processWatcher.setWindow(mainWindow);
    processWatcher.start();

    setTimeout(() => {
      if (!gsiService.isLive() && !processWatcher.isGameRunning() && settings.discordRPC !== false) {
        discordRPC.setIdle(db.getGames().length);
      }
    }, 1500);

    steamScanner.scan((progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('play:scanner:progress', progress);
      }
    }).then(async () => {
      const updatedStatus = steamScanner.getSteamStatus();
      if (updatedStatus.libraries && updatedStatus.libraries.length > 0) {
        gsiService.installGSIConfigs(updatedStatus.libraries);
      }
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

  mainWindow.on('close', (event) => {
    const currentSettings = db.getSettings();
    if (!isQuitting && currentSettings.minimizeToTray !== false) {
      event.preventDefault();
      mainWindow?.hide();
      if (miniWindow && !miniWindow.isDestroyed()) {
        miniWindow.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (miniWindow && !miniWindow.isDestroyed()) {
      miniWindow.close();
    }
    miniWindow = null;
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createMiniWindow();
    
    globalShortcut.register('CommandOrControl+Space', () => {
      toggleMiniWindow();
    });
    
    tray = new Tray(path.join(__dirname, '../build/icon.ico'));
    const updateMenu = () => {
      const recentGames = db.getGames().sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0)).slice(0, 5);
      const recentTemplate = recentGames.map(g => ({
        label: g.name,
        click: () => {
          gameLauncher.launchGame(g.id, mainWindow);
        }
      }));
      
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Storm Launcher', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
        { type: 'separator' },
        ...(recentTemplate.length > 0 ? [{ label: 'Recent Games', enabled: false }, ...recentTemplate, { type: 'separator' }] as any[] : []),
        { label: 'Quit', click: () => {
          isQuitting = true;
          app.quit();
        }}
      ]);
      tray?.setContextMenu(contextMenu);
    };
    
    updateMenu();
    tray.setToolTip('Storm Launcher');
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  });
}

app.on('window-all-closed', () => {
  processWatcher.stop();
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

ipcMain.handle('play:games:getAll', () => db.getGames());
ipcMain.handle('play:games:getById', (_, id) => db.getGame(id) || null);
ipcMain.handle('play:games:getActive', () => {
  const gsiStats = gsiService.getStats();
  const watcherInfo = processWatcher.getActiveGameInfo();
  if (gsiStats) {
    return {
      name: gsiStats.title,
      isGsi: true,
      gsiStats
    };
  }
  if (watcherInfo) {
    return {
      name: watcherInfo.name,
      startTime: watcherInfo.startTime,
      coverUrl: watcherInfo.coverUrl,
      isGsi: false
    };
  }
  return null;
});
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

ipcMain.handle('play:scanner:syncAll', async (_, force) => {
  const steamResult = await steamScanner.scan((prog) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('play:scanner:progress', prog);
    }
  }, force);

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
ipcMain.handle('play:scanner:cancelScanDisks', () => {
  deepDiskScanner.cancel();
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

ipcMain.handle('play:steamgrid:search', (_, query, type) => steamGridDBService.searchArtwork(query, type));
ipcMain.handle('play:steamgrid:apply', (_, gameId, type, url) => steamGridDBService.applyArtwork(gameId, type, url));

ipcMain.handle('play:achievements:get', (_, steamAppId) => achievementEngine.getAchievements(steamAppId));

ipcMain.handle('play:screenshots:get', (_, steamAppId) => screenshotManager.getScreenshotsForGame(steamAppId));
ipcMain.handle('play:screenshots:open', (_, steamAppId) => screenshotManager.openScreenshotsFolder(steamAppId));

ipcMain.handle('play:discord:updateStatus', (_, activity) => {
  discordRPC.setActivity(activity);
  return true;
});
ipcMain.handle('play:discord:setStatus', (_, statusType: string, extra?: any) => {
  if (['menu', 'searching', 'settings'].includes(statusType)) {
    if (gsiService.isLive() || processWatcher.isGameRunning()) {
      return false;
    }
  }

  const gameCount = db.getGames().length;
  if (statusType === 'menu') {
    discordRPC.setInMenu(gameCount);
  } else if (statusType === 'searching') {
    discordRPC.setSearchingGame(gameCount);
  } else if (statusType === 'settings') {
    discordRPC.setInSettings();
  } else if (statusType === 'launching') {
    discordRPC.setLaunching(extra?.name || extra || 'Game');
  } else if (statusType === 'playing') {
    discordRPC.setInGame(extra?.name || 'Game', extra?.startTime || Date.now(), extra?.coverUrl);
  }
  return true;
});
ipcMain.handle('play:game:getActive', () => {
  const gsiStats = gsiService.getStats();
  const watcherInfo = processWatcher.getActiveGameInfo();
  if (gsiStats) {
    return {
      name: gsiStats.title,
      isGsi: true,
      gsiStats
    };
  }
  if (watcherInfo) {
    return {
      name: watcherInfo.name,
      startTime: watcherInfo.startTime,
      coverUrl: watcherInfo.coverUrl,
      isGsi: false
    };
  }
  return null;
});
ipcMain.handle('play:gsi:getStats', () => gsiService.getStats());

// Inspector IPC handlers
ipcMain.handle('play:inspector:getDossier', (_, queryOrId) => inspectorService.getDossier(queryOrId));
ipcMain.handle('play:inspector:parseLobby', (_, rawText) => inspectorService.parseLobby(rawText));
ipcMain.handle('play:inspector:getMyProfile', () => inspectorService.getMyProfile());

ipcMain.handle('play:sessions:getAll', () => db.getSessions());
ipcMain.handle('play:sessions:getStats', () => db.getStats());
ipcMain.handle('play:sessions:getSessionsByGame', (_, gameId, limit) => db.getSessionsByGame(gameId, limit || 20));
ipcMain.handle('play:stats:getSessionsByGame', (_, gameId, limit) => db.getSessionsByGame(gameId, limit || 20));

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

ipcMain.handle('play:settings:get', () => db.getSettings());
ipcMain.handle('play:settings:update', (_, partial) => {
  if (partial.discordRPC !== undefined) {
    discordRPC.setEnabled(partial.discordRPC);
  }
  if (partial.startWithWindows !== undefined) {
    try {
      app.setLoginItemSettings({
        openAtLogin: Boolean(partial.startWithWindows),
        path: app.getPath('exe')
      });
    } catch (e) {
      console.warn('Failed to set login item settings:', e);
    }
  }
  const updated = db.saveSettings(partial);
  if (partial.language !== undefined) {
    processWatcher.refreshLanguage();
    gsiService.refreshLanguage();
  }
  return updated;
});

ipcMain.handle('play:system:clearCache', async () => {
  const cacheDir = db.getCacheDir();
  let freedBytes = 0;
  let count = 0;
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    for (const f of files) {
      try {
        const p = path.join(cacheDir, f);
        const st = fs.statSync(p);
        if (st.isFile()) {
          freedBytes += st.size;
          fs.unlinkSync(p);
          count++;
        }
      } catch {}
    }
  }
  return {
    freedMb: Number((freedBytes / (1024 * 1024)).toFixed(1)),
    count
  };
});

ipcMain.on('play:system:minimize', () => mainWindow?.minimize());
ipcMain.on('play:system:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on('play:system:close', () => {
  if (mainWindow?.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow?.close();
  }
});
ipcMain.on('play:system:showMain', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
  if (miniWindow) {
    miniWindow.hide();
  }
});
ipcMain.on('play:system:toggleMiniMode', toggleMiniWindow);
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
