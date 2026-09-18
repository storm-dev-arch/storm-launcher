import { contextBridge, ipcRenderer } from 'electron';
import type { StormPlayAPI, Game, CandidateExe, LauncherSettings, ScannerProgress, SessionRecord, CollectionRecord } from '../shared/types';

const safeInvoke = async (channel: string, ...args: any[]) => {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (err: any) {
    console.error(`IPC Error on ${channel}:`, err);
    throw new Error(err.message || 'Unknown IPC Error');
  }
};

const api: StormPlayAPI = {
  games: {
    getAll: () => safeInvoke('play:games:getAll'),
    getById: (id: string) => safeInvoke('play:games:getById', id),
    getActiveGame: () => safeInvoke('play:game:getActive'),
    toggleFavorite: (id: string) => safeInvoke('play:games:toggleFavorite', id),
    addCustom: (game: Partial<Game>) => safeInvoke('play:games:addCustom', game),
    update: (id: string, partial: Partial<Game>) => safeInvoke('play:games:update', id, partial),
    delete: (id: string) => safeInvoke('play:games:delete', id),
    launch: (id: string) => safeInvoke('play:games:launch', id),
    openInstallFolder: (id: string) => safeInvoke('play:games:openInstallFolder', id),
    createDesktopShortcut: (id: string) => safeInvoke('play:games:createDesktopShortcut', id)
  },
  scanner: {
    syncAll: (force?: boolean) => safeInvoke('play:scanner:syncAll', force),
    scanSteam: (force?: boolean) => safeInvoke('play:scanner:scanSteam', force),
    scanMultiLaunchers: () => safeInvoke('play:scanner:scanMultiLaunchers'),
    deepScanDisks: () => safeInvoke('play:scanner:deepScanDisks'),
    cancelScanDisks: () => safeInvoke('play:scanner:cancelScanDisks'),
    scanFolderForExecutables: (folderPath: string) => safeInvoke('play:scanner:scanFolderForExecutables', folderPath),
    selectFolder: () => safeInvoke('play:scanner:selectFolder'),
    selectFile: (filters) => safeInvoke('play:scanner:selectFile', filters),
    getSteamStatus: () => safeInvoke('play:scanner:getSteamStatus')
  },
  steamGrid: {
    search: (gameName: string, type?: 'cover' | 'hero' | 'logo') => safeInvoke('play:steamgrid:search', gameName, type),
    applyArtwork: (gameId: string, type: 'cover' | 'hero' | 'logo', url: string) => safeInvoke('play:steamgrid:apply', gameId, type, url)
  },
  achievements: {
    get: (steamAppId: number) => safeInvoke('play:achievements:get', steamAppId)
  },
  screenshots: {
    get: (steamAppId: number) => safeInvoke('play:screenshots:get', steamAppId),
    openFolder: (steamAppId: number) => safeInvoke('play:screenshots:open', steamAppId)
  },
  discord: {
    updateStatus: (activity) => safeInvoke('play:discord:updateStatus', activity),
    setStatus: (statusType: 'menu' | 'searching' | 'settings' | 'launching' | 'playing', extra?: any) =>
      safeInvoke('play:discord:setStatus', statusType, extra)
  },
  gsi: {
    getStats: () => safeInvoke('play:gsi:getStats')
  },
  sessions: {
    getAll: () => safeInvoke('play:sessions:getAll'),
    getStats: () => safeInvoke('play:sessions:getStats'),
    getSessionsByGame: (gameId: string, limit?: number) => safeInvoke('play:stats:getSessionsByGame', gameId, limit)
  },
  stats: {
    getSessionsByGame: (gameId: string, limit?: number) => safeInvoke('play:stats:getSessionsByGame', gameId, limit)
  },
  collections: {
    getAll: () => safeInvoke('play:collections:getAll'),
    create: (name: string, color?: string) => safeInvoke('play:collections:create', name, color),
    update: (id: string, partial: Partial<CollectionRecord>) => safeInvoke('play:collections:update', id, partial),
    delete: (id: string) => safeInvoke('play:collections:delete', id),
    addGame: (collectionId: string, gameId: string) => safeInvoke('play:collections:addGame', collectionId, gameId),
    removeGame: (collectionId: string, gameId: string) => safeInvoke('play:collections:removeGame', collectionId, gameId)
  },
  settings: {
    get: () => safeInvoke('play:settings:get'),
    update: (partial: Partial<LauncherSettings>) => safeInvoke('play:settings:update', partial)
  },
  system: {
    minimize: () => ipcRenderer.send('play:system:minimize'),
    maximize: () => ipcRenderer.send('play:system:maximize'),
    close: () => ipcRenderer.send('play:system:close'),
    showMain: () => ipcRenderer.send('play:system:showMain'),
    toggleMiniMode: () => ipcRenderer.send('play:system:toggleMiniMode'),
    isMaximized: () => safeInvoke('play:system:isMaximized'),
    openExternal: (url: string) => safeInvoke('play:system:openExternal', url),
    getPCSpecs: () => safeInvoke('play:system:getPCSpecs'),
    clearCache: () => safeInvoke('play:system:clearCache')
  },
  events: {
    onGameLaunched: (callback) => {
      const handler = (_: any, game: Game) => callback(game);
      ipcRenderer.on('play:game:launched', handler);
      return () => ipcRenderer.removeListener('play:game:launched', handler);
    },
    onGameStopped: (callback) => {
      const handler = (_: any, data: { gameId: string; session: SessionRecord }) => callback(data);
      ipcRenderer.on('play:game:stopped', handler);
      return () => ipcRenderer.removeListener('play:game:stopped', handler);
    },
    onScanProgress: (callback) => {
      const handler = (_: any, progress: ScannerProgress) => callback(progress);
      ipcRenderer.on('play:scanner:progress', handler);
      return () => ipcRenderer.removeListener('play:scanner:progress', handler);
    },
    onGamesUpdated: (callback) => {
      const handler = (_: any, games: Game[]) => callback(games);
      ipcRenderer.on('play:games:updated', handler);
      return () => ipcRenderer.removeListener('play:games:updated', handler);
    },
    onGSIUpdate: (callback) => {
      const handler = (_: any, stats: any) => callback(stats);
      ipcRenderer.on('play:gsi:update', handler);
      return () => ipcRenderer.removeListener('play:gsi:update', handler);
    },
    onActiveGameChange: (callback) => {
      const handler = (_: any, active: any) => callback(active);
      ipcRenderer.on('play:game:activeChange', handler);
      return () => ipcRenderer.removeListener('play:game:activeChange', handler);
    }
  }
};

contextBridge.exposeInMainWorld('stormPlay', api);
