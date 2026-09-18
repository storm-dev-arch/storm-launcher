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
  notes?: string;
  tags?: string[];
  goal?: number; // Target playtime in hours
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
  theme: 'dark' | 'light';
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
  sortBy: 'name' | 'name-desc' | 'recent' | 'playtime' | 'added' | 'platform';
  defaultFilter?: string;
  firstLaunchDone: boolean;
  language: 'ru' | 'en';
  discordRPC: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  steamGridApiKey?: string;
  minimizeToTray?: boolean;
  closeOnLaunch?: boolean;
  lowPerformanceMode?: boolean;
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

export interface LiveGameStats {
  game: 'dota2' | 'cs2';
  title: string;
  details: string;
  state: string;
  heroOrMap?: string;
  scoreOrKDA?: string;
  matchTime?: string;
  heroIcon?: string;
  level?: number;
  kda?: { kills: number; deaths: number; assists: number };
  paused?: boolean;
  gameState?: string;
  mode?: string;
  teamScores?: { ct: number; t: number };
}

export interface ActiveGameInfo {
  name: string;
  exeName?: string;
  gameId?: string;
  startTime?: number;
  coverUrl?: string;
  isGsi?: boolean;
  gsiStats?: LiveGameStats | null;
}

export interface PlayerHeroStats {
  heroId: number;
  heroName: string;
  heroIcon: string;
  games: number;
  wins: number;
  winrate: number;
}

export interface PlayerRecentMatch {
  matchId: string | number;
  heroId: number;
  heroName: string;
  heroIcon: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: string;
  won: boolean;
  durationSeconds: number;
  playedAt: number;
}

export interface ModeWinrateStats {
  winrate: number | null; // null if games === 0 (insufficient data)
  wins: number;
  losses: number;
  games: number;
  formatted: string; // e.g. "70%" or "Недостаточно данных"
  detailText: string; // e.g. "42W / 18L" or "0 матчей"
}

export interface DebugMatchInfo {
  matchId: number | string;
  gameMode: number;
  lobbyType: number;
  won: boolean;
  startTime: number;
  heroId: number;
  heroName?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  source: string;
}

export type SmurfSuspicionLevel = 'high_smurf' | 'high_suspicion' | 'suspicious' | 'clean';

export interface SmurfThreatAnalysis {
  isSmurfSuspect: boolean;
  smurfChancePercent: number; // 0 - 100%
  suspicionLevel: SmurfSuspicionLevel;
  threatLevel: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0 - 100%
  reasons: string[];
  winStreak: number;
  loseStreak: number;
  isOneTrickPony: boolean;
  signatureHeroAlert?: string;
  recentWinrate: number; // last 20 games winrate %
  summaryHeadline?: string;
}

export interface PlayerDossier {
  accountId: number;
  steamId64?: string;
  name: string;
  avatar: string;
  profileUrl: string;
  isPrivate: boolean;
  rankTier?: number;
  rankName?: string;
  rankStars?: number;
  rankBadgeUrl?: string;
  leaderboardRank?: number;
  exactMmr?: number | null; // Authentic MMR if present, otherwise null
  mmrDisplay: string; // "Недоступен публично" or exact number
  wins: number;
  losses: number;
  totalGames: number;
  overallWinrate: number;
  rankedStats: ModeWinrateStats;
  turboStats: ModeWinrateStats;
  allPickStats: ModeWinrateStats;
  topHeroes: PlayerHeroStats[];
  recentMatches: PlayerRecentMatch[];
  smurfAnalysis: SmurfThreatAnalysis;
  debugMatches?: DebugMatchInfo[];
  team?: 'radiant' | 'dire' | 'unassigned';
}

export interface LobbyRoster {
  radiant: PlayerDossier[];
  dire: PlayerDossier[];
  unassigned: PlayerDossier[];
  totalPlayers: number;
  smurfCount: number;
  privateCount: number;
}

export interface StormPlayAPI {
  games: {
    getAll: () => Promise<Game[]>;
    getById: (id: string) => Promise<Game | null>;
    getActiveGame: () => Promise<ActiveGameInfo | null>;
    toggleFavorite: (id: string) => Promise<Game | null>;
    addCustom: (game: Partial<Game>) => Promise<Game>;
    update: (id: string, partial: Partial<Game>) => Promise<Game>;
    delete: (id: string) => Promise<boolean>;
    launch: (id: string) => Promise<{ success: boolean; error?: string }>;
    openInstallFolder: (id: string) => Promise<void>;
    createDesktopShortcut: (id: string) => Promise<{ success: boolean; error?: string }>;
  };
  scanner: {
    syncAll: (force?: boolean) => Promise<{ games: Game[]; progress: ScannerProgress }>;
    scanSteam: (force?: boolean) => Promise<{ games: Game[]; progress: ScannerProgress }>;
    scanMultiLaunchers: () => Promise<Game[]>;
    deepScanDisks: () => Promise<CandidateExe[]>;
    cancelScanDisks: () => Promise<void>;
    scanFolderForExecutables: (folderPath: string) => Promise<CandidateExe[]>;
    selectFolder: () => Promise<string | null>;
    selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
    getSteamStatus: () => Promise<{ installed: boolean; libraries: string[] }>;
  };
  steamGrid: {
    search: (query: string, type?: 'cover' | 'hero' | 'logo') => Promise<SteamGridArtItem[]>;
    applyArtwork: (gameId: string, type: 'cover' | 'hero' | 'logo', url: string) => Promise<Game>;
  };
  steamgrid?: {
    search: (query: string, type?: 'cover' | 'hero' | 'logo') => Promise<SteamGridArtItem[]>;
    applyArtwork?: (gameId: string, type: 'cover' | 'hero' | 'logo', url: string) => Promise<Game>;
    apply?: (gameId: string, type: 'cover' | 'hero' | 'logo', url: string) => Promise<Game>;
  };
  achievements: {
    get: (steamAppId: number) => Promise<AchievementItem[]>;
  };
  screenshots: {
    get: (steamAppId: number) => Promise<string[]>;
    openFolder: (steamAppId: number) => Promise<void>;
    open?: (steamAppId: number) => Promise<void>;
  };
  discord: {
    updateStatus: (activity: { state?: string; details?: string; gameName?: string }) => Promise<void>;
    setStatus: (statusType: 'menu' | 'searching' | 'settings' | 'launching' | 'playing', extra?: any) => Promise<boolean>;
  };
  gsi: {
    getStats: () => Promise<LiveGameStats | null>;
  };
  inspector: {
    getDossier: (queryOrId: string | number) => Promise<PlayerDossier>;
    parseLobby: (rawText: string) => Promise<LobbyRoster>;
    getMyProfile: () => Promise<PlayerDossier | null>;
  };
  sessions: {
    getAll: () => Promise<SessionRecord[]>;
    getStats: () => Promise<LauncherStats>;
    getSessionsByGame: (gameId: string, limit?: number) => Promise<SessionRecord[]>;
  };
  stats: {
    getSessionsByGame: (gameId: string, limit?: number) => Promise<SessionRecord[]>;
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
    showMain: () => void;
    toggleMiniMode: () => void;
    isMaximized: () => Promise<boolean>;
    openExternal: (url: string) => Promise<void>;
    getPCSpecs: () => Promise<{ cpu: string; ram: string; os: string }>;
    clearCache: () => Promise<{ freedMb: number; count: number }>;
  };
  events: {
    onGameLaunched: (callback: (game: Game) => void) => () => void;
    onGameStopped: (callback: (data: { gameId: string; session: SessionRecord }) => void) => () => void;
    onScanProgress: (callback: (progress: ScannerProgress) => void) => () => void;
    onGamesUpdated: (callback: (games: Game[]) => void) => () => void;
    onGSIUpdate: (callback: (stats: LiveGameStats | null) => void) => () => void;
    onActiveGameChange: (callback: (active: ActiveGameInfo | null) => void) => () => void;
  };
}

declare global {
  interface Window {
    stormPlay: StormPlayAPI;
  }
}
