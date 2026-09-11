export type GameSource = 'steam' | 'epic' | 'gog' | 'ea' | 'ubisoft' | 'custom';

export interface AchievementItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  unlocked: boolean;
  unlockTime?: number;
}

export interface SteamGridArtItem {
  id: string | number;
  url: string;
  thumb: string;
  type: 'cover' | 'hero' | 'logo';
  width: number;
  height: number;
  author?: string;
}

export interface Game {
  id: string;
  source: GameSource;
  name: string;
  steamAppId?: number;
  epicAppId?: string;
  gogAppId?: string;
  installPath: string;
  executable?: string;
  launchCommand?: string;
  arguments?: string;
  workingDirectory?: string;
  installed: boolean;
  favorite: boolean;
  playtimeMinutes: number;
  lastPlayed?: number;
  dateAdded: number;
  custom: boolean;
  artwork: {
    cover?: string;
    hero?: string;
    logo?: string;
    icon?: string;
    background?: string;
  };
  description?: string;
  developer?: string;
  publisher?: string;
  genres?: string[];
  collections: string[];
  launchCount: number;
  totalSessionTimeMinutes: number;
  sizeOnDisk?: number;
  requirements?: {
    minimum?: string;
    recommended?: string;
  };
  isRunning?: boolean;
  achievements?: {
    total: number;
    unlocked: number;
    items?: AchievementItem[];
  };
  screenshots?: string[];
}

export interface SessionRecord {
  id: string;
  gameId: string;
  gameName: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
}

export interface CollectionRecord {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: number;
  gameIds: string[];
}

export interface LauncherSettings {
  theme: 'obsidian' | 'oled' | 'graphite' | 'midnight' | 'crimson' | 'emerald' | 'purple';
  glassIntensity: number;
  blurAmount: number;
  cardOpacity: number;
  borderOpacity: number;
  cornerRadius: number;
  animationIntensity: 'off' | 'subtle' | 'normal';
  dynamicBackground: boolean;
  startWithWindows: boolean;
  startMinimized: boolean;
  steamPaths: string[];
  customScanPaths: string[];
  defaultView: 'grid' | 'compact' | 'list';
  sortBy: 'name' | 'recent' | 'playtime' | 'added';
  firstLaunchDone: boolean;
  language: 'ru' | 'en';
  discordRPC: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  steamGridApiKey?: string;
}

export interface ScannerProgress {
  stage: 'detecting' | 'libraries' | 'reading_games' | 'metadata' | 'ready' | 'idle';
  message: string;
  librariesFound: number;
  gamesDetected: number;
  gamesInstalled: number;
}

export interface LauncherStats {
  totalGames: number;
  installedGames: number;
  customGames: number;
  steamGames: number;
  epicGames?: number;
  gogGames?: number;
  totalPlaytimeMinutes: number;
  recentSessions: SessionRecord[];
  mostPlayed: Game[];
  playtimeByDay: { [dateStr: string]: number };
}

export interface CandidateExe {
  path: string;
  name: string;
  suggestedTitle: string;
  folder: string;
  sizeBytes?: number;
  icon?: string;
  sourceLauncher?: GameSource;
}

export interface StormPlayAPI {
  games: {
    getAll: () => Promise<Game[]>;
    getById: (id: string) => Promise<Game | null>;
    toggleFavorite: (id: string) => Promise<boolean>;
    addCustom: (game: Partial<Game>) => Promise<Game>;
    update: (id: string, partial: Partial<Game>) => Promise<Game>;
    delete: (id: string) => Promise<boolean>;
    launch: (id: string) => Promise<{ success: boolean; error?: string }>;
    openInstallFolder: (id: string) => Promise<void>;
    createDesktopShortcut: (id: string) => Promise<{ success: boolean; path?: string }>;
  };
  scanner: {
    syncAll: (force?: boolean) => Promise<{ games: Game[]; progress: ScannerProgress }>;
    scanSteam: (force?: boolean) => Promise<{ games: Game[]; progress: ScannerProgress }>;
    scanMultiLaunchers: () => Promise<Game[]>;
    deepScanDisks: (onProgress?: (msg: string) => void) => Promise<CandidateExe[]>;
    scanFolderForExecutables: (folderPath: string) => Promise<CandidateExe[]>;
    selectFolder: () => Promise<string | null>;
    selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
    getSteamStatus: () => Promise<{ installed: boolean; path?: string; libraries: string[] }>;
  };
  steamGrid: {
    search: (gameName: string, type?: 'cover' | 'hero' | 'logo') => Promise<SteamGridArtItem[]>;
    applyArtwork: (gameId: string, type: 'cover' | 'hero' | 'logo', url: string) => Promise<Game>;
  };
  achievements: {
    get: (steamAppId: number) => Promise<{ total: number; unlocked: number; items: AchievementItem[] }>;
  };
  screenshots: {
    get: (steamAppId: number) => Promise<string[]>;
    openFolder: (steamAppId: number) => Promise<void>;
  };
  discord: {
    updateStatus: (activity: { state?: string; details?: string; gameName?: string }) => Promise<void>;
  };
  gsi: {
    getStats: () => Promise<any>;
  };
  sessions: {
    getAll: () => Promise<SessionRecord[]>;
    getStats: () => Promise<LauncherStats>;
  };
  collections: {
    getAll: () => Promise<CollectionRecord[]>;
    create: (name: string, color?: string) => Promise<CollectionRecord>;
    update: (id: string, partial: Partial<CollectionRecord>) => Promise<CollectionRecord>;
    delete: (id: string) => Promise<boolean>;
    addGame: (collectionId: string, gameId: string) => Promise<boolean>;
    removeGame: (collectionId: string, gameId: string) => Promise<boolean>;
  };
  settings: {
    get: () => Promise<LauncherSettings>;
    update: (partial: Partial<LauncherSettings>) => Promise<LauncherSettings>;
  };
  system: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    openExternal: (url: string) => Promise<void>;
    getPCSpecs: () => Promise<{ cpu: string; ram: string; os: string }>;
  };
  events: {
    onGameLaunched: (callback: (game: Game) => void) => () => void;
    onGameStopped: (callback: (data: { gameId: string; session: SessionRecord }) => void) => () => void;
    onScanProgress: (callback: (progress: ScannerProgress) => void) => () => void;
    onGamesUpdated: (callback: (games: Game[]) => void) => () => void;
    onGSIUpdate: (callback: (stats: any) => void) => () => void;
  };
}

declare global {
  interface Window {
    stormPlay: StormPlayAPI;
  }
}
