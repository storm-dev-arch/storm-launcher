import { contextBridge, ipcRenderer } from 'electron';
import type { StormPlayAPI, Game, CandidateExe, LauncherSettings, ScannerProgress, SessionRecord, CollectionRecord } from '../shared/types';

const api: StormPlayAPI = {
  games: {
    getAll: () => ipcRenderer.invoke('play:games:getAll'),
    getById: (id: string) => ipcRenderer.invoke('play:games:getById', id),
    toggleFavorite: (id: string) => ipcRenderer.invoke('play:games:toggleFavorite', id),
    addCustom: (game: Partial<Game>) => ipcRenderer.invoke('play:games:addCustom', game),
    update: (id: string, partial: Partial<Game>) => ipcRenderer.invoke('play:games:update', id, partial),
    delete: (id: string) => ipcRenderer.invoke('play:games:delete', id),
    launch: (id: string) => ipcRenderer.invoke('play:games:launch', id),
    openInstallFolder: (id: string) => ipcRenderer.invoke('play:games:openInstallFolder', id),
    createDesktopShortcut: (id: string) => ipcRenderer.invoke('play:games:createDesktopShortcut', id)
  },
  scanner: {
    syncAll: (force?: boolean) => ipcRenderer.invoke('play:scanner:syncAll', force),
    scanSteam: (force?: boolean) => ipcRenderer.invoke('play:scanner:scanSteam', force),
    scanMultiLaunchers: () => ipcRenderer.invoke('play:scanner:scanMultiLaunchers'),
    deepScanDisks: () => ipcRenderer.invoke('play:scanner:deepScanDisks'),
    scanFolderForExecutables: (folderPath: string) => ipcRenderer.invoke('play:scanner:scanFolderForExecutables', folderPath),
    selectFolder: () => ipcRenderer.invoke('play:scanner:selectFolder'),
    selectFile: (filters) => ipcRenderer.invoke('play:scanner:selectFile', filters),
    getSteamStatus: () => ipcRenderer.invoke('play:scanner:getSteamStatus')
  },
  steamGrid: {
    search: (gameName: string, type?: 'cover' | 'hero' | 'logo') => ipcRenderer.invoke('play:steamgrid:search', gameName, type),
    applyArtwork: (gameId: string, type: 'cover' | 'hero' | 'logo', url: string) => ipcRenderer.invoke('play:steamgrid:apply', gameId, type, url)
  },
  achievements: {
    get: (steamAppId: number) => ipcRenderer.invoke('play:achievements:get', steamAppId)
  },
  screenshots: {
    get: (steamAppId: number) => ipcRenderer.invoke('play:screenshots:get', steamAppId),
    openFolder: (steamAppId: number) => ipcRenderer.invoke('play:screenshots:open', steamAppId)
  },
  discord: {
    updateStatus: (activity) => ipcRenderer.invoke('play:discord:updateStatus', activity)
  },
  gsi: {
    getStats: () => ipcRenderer.invoke('play:gsi:getStats')
  },
  sessions: {
    getAll: () => ipcRenderer.invoke('play:sessions:getAll'),
    getStats: () => ipcRenderer.invoke('play:sessions:getStats')
  },
  collections: {
    getAll: () => ipcRenderer.invoke('play:collections:getAll'),
    create: (name: string, color?: string) => ipcRenderer.invoke('play:collections:create', name, color),
    update: (id: string, partial: Partial<CollectionRecord>) => ipcRenderer.invoke('play:collections:update', id, partial),
    delete: (id: string) => ipcRenderer.invoke('play:collections:delete', id),
    addGame: (collectionId: string, gameId: string) => ipcRenderer.invoke('play:collections:addGame', collectionId, gameId),
    removeGame: (collectionId: string, gameId: string) => ipcRenderer.invoke('play:collections:removeGame', collectionId, gameId)
  },
  settings: {
    get: () => ipcRenderer.invoke('play:settings:get'),
    update: (partial: Partial<LauncherSettings>) => ipcRenderer.invoke('play:settings:update', partial)
  },
  system: {
    minimize: () => ipcRenderer.send('play:system:minimize'),
    maximize: () => ipcRenderer.send('play:system:maximize'),
    close: () => ipcRenderer.send('play:system:close'),
    isMaximized: () => ipcRenderer.invoke('play:system:isMaximized'),
    openExternal: (url: string) => ipcRenderer.invoke('play:system:openExternal', url),
    getPCSpecs: () => ipcRenderer.invoke('play:system:getPCSpecs')
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
    }
  }
};

contextBridge.exposeInMainWorld('stormPlay', api);
