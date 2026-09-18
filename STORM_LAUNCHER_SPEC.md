# STORM LAUNCHER — Comprehensive Technical Specification & Architecture Manual
> **Document Version**: 2.0.0 (Liquid Glass Edition)  
> **Target Audience**: AI Agents, Systems Architects, Full-Stack Developers  
> **Platform**: Windows 10/11 (x64), Electron 34+, Node.js 20+, React 19, TypeScript 5+

---

## 1. Executive Summary

**Storm Launcher** is an open-source, high-performance desktop game library manager and launcher. It aggregates games from multiple platforms (**Steam**, **Epic Games Launcher**, **GOG Galaxy**, and **Standalone / Emulated / Custom executables**) into a single, cohesive, luxury desktop application.

### Key Value Propositions
1. **Unified Library**: Automatic background discovery and metadata extraction across all major PC gaming storefronts without requiring external accounts or API keys for basic scanning.
2. **Liquid Glass Aesthetic**: A bespoke user interface inspired by modern glassmorphism (Framer Glasso, Apple VisionOS, macOS Sonoma) featuring dual specular reflection edges, frosted backdrop blurs, GPU-accelerated spring animations, and an obsidian monochrome palette.
3. **Deep Windows Integration**: Direct process tracking, child process tree polling, accurate play session logging, custom shortcut creation, Discord Rich Presence integration, and system tray minimization.
4. **Performance by Design**: Virtualized game grid rendering (`react-window`), responsive 5-column layout with mathematically scaled 16:9 item heights, multi-threaded background scanning, and SQLite database storage via `better-sqlite3`.

---

## 2. Technology Stack & Tooling

| Layer | Technologies |
|---|---|
| **Runtime & Shell** | Electron 34, Node.js 20, Windows Win32 APIs / PowerShell / Registry |
| **Frontend Framework** | React 19, TypeScript 5.7, Vite 6 |
| **Styling & Motion** | Pure CSS Variables, Framer-style Spring Physics (`cubic-bezier(0.16, 1, 0.3, 1)`), Dynamic WebGL Canvas Shader (`BackgroundShader.tsx`), Glassmorphic Inset Highlights |
| **Virtualization** | `react-window` (Grid & List virtualization for thousands of games at 60+ FPS) |
| **Icons & Media** | `lucide-react`, Custom Web Audio API Synthesizer (`soundEngine.ts`) |
| **Data Persistence** | SQLite3 via `better-sqlite3` with WAL mode enabled, Electron Store fallback |
| **Inter-Process Comm.** | Electron `contextBridge` + Type-Safe typed IPC handlers |
| **Bundling & Build** | `vite` (renderer), `vite-plugin-electron` (main & preload compilation), `tsc` |

---

## 3. Project Directory Structure

```
storm-launcher-main/
├── dist/                      # Compiled frontend static assets (HTML/CSS/JS)
├── dist-electron/             # Compiled Electron main and preload bundles
├── src/
│   ├── main/                  # Node.js / Electron Main Process
│   │   ├── database/          # SQLite schema, queries, migration logic
│   │   │   ├── index.ts       # Database connection & table initializers
│   │   │   └── queries.ts     # CRUD for games, sessions, collections, settings
│   │   ├── scanner/           # Platform detection & library discovery
│   │   │   ├── steamScanner.ts# Registry, libraryfolders.vdf & appmanifest parser
│   │   │   ├── epicScanner.ts # ProgramData/Epic/Manifests JSON parser
│   │   │   ├── gogScanner.ts  # Windows Registry HKLM WOW6432Node GOG parser
│   │   │   └── folderScanner.ts# Recursive .exe discovery for custom games
│   │   ├── launcher/          # Process spawning & playtime tracking
│   │   │   ├── processTracker.ts # Process polling & session recording
│   │   │   └── gameLauncher.ts   # URI & executable executor
│   │   ├── discord/           # Discord RPC presence manager
│   │   ├── steamgrid/         # SteamGridDB API integration for cover art
│   │   ├── tray/              # Tray icon & system context menu
│   │   ├── autostart/         # Windows Registry Run key manager
│   │   ├── index.ts           # Electron app lifecycle & IPC channel definitions
│   │   └── preload.ts         # Secure contextBridge exposing window.stormPlay
│   │
│   ├── renderer/              # React 19 Frontend
│   │   ├── audio/
│   │   │   └── soundEngine.ts # Web Audio synthetic micro-clicks & sound effects
│   │   ├── components/        # Reusable UI components
│   │   │   ├── BackgroundShader.tsx # Subtle GPU liquid wave ambient shader
│   │   │   ├── TitleBar.tsx         # VisionOS Dynamic Island TitleBar (Ctrl+K, RU/EN)
│   │   │   ├── Sidebar.tsx          # Liquid Glass floating navigation sidebar
│   │   │   ├── GameCard.tsx         # Liquid card with cover, play button, badges
│   │   │   ├── GameContextMenu.tsx  # Right-click context actions
│   │   │   ├── CommandPalette.tsx   # Ctrl+K spotlight search & quick actions
│   │   │   ├── Toast.tsx            # Frosted glass toast notification container
│   │   │   ├── SteamGridModal.tsx   # Cover artwork selector & downloader
│   │   │   ├── AddGameModal.tsx     # Manual custom executable adder
│   │   │   ├── ScanGamesModal.tsx   # Disk scanner configuration modal
│   │   │   └── WhatShouldIPlayModal.tsx # Random game picker / roulette
│   │   ├── pages/             # View routers
│   │   │   ├── OverviewPage.tsx     # Featured game hero, metrics, recent list
│   │   │   ├── LibraryPage.tsx      # Virtualized 5-column grid & filter toolbar
│   │   │   ├── GameDetailPage.tsx   # Wide backdrop, screenshots, launch & stats
│   │   │   ├── CollectionsPage.tsx  # User-defined folders and playlists
│   │   │   ├── StatisticsPage.tsx   # Playtime graphs and gaming habits
│   │   │   └── SettingsPage.tsx     # Glass physics toggles, audio, themes, paths
│   │   ├── i18n/
│   │   │   └── translations.ts      # Full RU & EN localization dictionary
│   │   ├── styles/
│   │   │   ├── theme.css            # Liquid Glass tokens, specular edges, inputs
│   │   │   └── animations.css       # Spring physics curves and transition states
│   │   ├── App.tsx                  # Root layout, modal state, global keybindings
│   │   └── main.tsx                 # React DOM mount point
│   │
│   └── shared/
│       └── types.ts                 # Shared TypeScript interfaces (Game, Session, etc.)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Shared Data Models (`src/shared/types.ts`)

```typescript
export interface GameArtwork {
  cover?: string;      // Vertical poster (600x900)
  hero?: string;       // Wide cinematic banner (1920x620)
  logo?: string;       // Transparent game title logo
  icon?: string;       // Small square app icon
  screenshots?: string[]; // In-game screenshots
}

export interface Game {
  id: string;               // UUID or deterministic hash (e.g. steam_730)
  name: string;             // Game title
  source: 'steam' | 'epic' | 'gog' | 'custom'; // Source platform
  executablePath?: string;  // Absolute path to .exe or launcher URI
  launchArguments?: string; // Command line arguments (e.g. -novid)
  installed: boolean;       // Installation state
  installDirectory?: string;// Game install folder
  playtimeMinutes: number;  // Cumulative total minutes played
  lastPlayed?: number;      // Unix timestamp (ms) of last session
  favorite: boolean;        // Favorite flag
  artwork: GameArtwork;     // Covers, banners, logos
  appId?: string;           // Platform specific ID (Steam AppId, Epic AppName)
  dateAdded: number;        // Timestamp added to library
  tags?: string[];          // Genre / custom tags
  custom?: boolean;         // Manually added by user
}

export interface GameSession {
  id: string;
  gameId: string;
  gameName: string;
  startTime: number;        // Timestamp ms
  endTime: number;          // Timestamp ms
  durationMinutes: number;  // Session length
}

export interface Collection {
  id: string;
  name: string;
  gameIds: string[];
  color?: string;
  createdAt: number;
}

export interface LauncherSettings {
  theme: 'dark' | 'light';  // Dark (Obsidian Glass) or Light (Frosted Porcelain)
  language: 'ru' | 'en';    // Current UI language
  blurAmount: number;       // CSS blur strength (0 - 40px)
  cardOpacity: number;      // Glass opacity (0.05 - 0.95)
  lowPerformanceMode: boolean; // Disables WebGL shader & heavy blurs
  soundEnabled: boolean;    // Web Audio micro-sound effects
  soundVolume: number;      // Audio volume (0.0 - 1.0)
  discordRpcEnabled: boolean; // Discord Rich Presence
  minimizeToTray: boolean;  // Minimize to system tray on close
  startOnBoot: boolean;     // Windows autostart registry entry
  steamGridApiKey?: string; // SteamGridDB API key for cover fetching
  customScanFolders?: string[]; // Custom directories scanned for .exe files
  defaultView?: 'grid' | 'compact' | 'list'; // Default library layout
  sortBy?: 'name' | 'playtime' | 'recent' | 'added'; // Default library sort
  firstLaunchDone?: boolean;// Has user completed onboarding?
}
```

---

## 5. Main Process Subsystems

### 5.1 Game Scanners
1. **Steam Scanner (`src/main/scanner/steamScanner.ts`)**:
   - Locates Steam via Windows Registry: `HKCU\Software\Valve\Steam\SteamPath`.
   - Reads `config/libraryfolders.vdf` to discover all mounted Steam library paths across all drives.
   - Scans each library's `steamapps/appmanifest_<id>.acf` to extract `appid`, `name`, `installdir`, and `StateFlags` (determines if fully installed).
   - Automatically references Steam CDN for default covers:
     `https://cdn.cloudflare.steamstatic.com/steam/apps/<appid>/library_600x900.jpg`.
2. **Epic Games Scanner (`src/main/scanner/epicScanner.ts`)**:
   - Inspects `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests\*.item`.
   - Parses JSON manifests extracting `DisplayName`, `InstallLocation`, `LaunchExecutable`, and `AppName`.
3. **GOG Galaxy Scanner (`src/main/scanner/gogScanner.ts`)**:
   - Inspects Windows Registry key `HKLM\SOFTWARE\WOW6432Node\GOG.com\Games`.
   - Reads `gameID`, `gameName`, `path`, and `exe`.
4. **Folder Scanner (`src/main/scanner/folderScanner.ts`)**:
   - Recursively walks user-selected folders up to 3 directory levels deep.
   - Filters for non-system executables (skipping `unins*.exe`, `crashpad*.exe`, `redist/`, etc.).
   - Generates deterministic game entries with icons extracted from the PE header.

### 5.2 Process Tracker & Playtime Monitoring (`src/main/launcher/processTracker.ts`)
- Spawns games either via protocol URL (e.g. `steam://rungameid/<id>`) or direct child process `child_process.spawn()`.
- Windows process polling: runs every 5 seconds using `tasklist` or WMI process tree querying to verify if the executable or its child process tree is still alive.
- Upon process termination:
  - Computes total session duration.
  - Updates `playtimeMinutes` and `lastPlayed` in the SQLite `games` table.
  - Inserts a new record into `sessions` table.
  - Emits an IPC event `game:sessionEnded` to inform the renderer to refresh stats.

### 5.3 Database Layer (`src/main/database/`)
- Utilizes `better-sqlite3` located at `%APPDATA%/storm-launcher/storm_library.db`.
- WAL (Write-Ahead Logging) mode is activated on startup for non-blocking concurrent reads and writes.
- Enforces relational foreign keys with `ON DELETE CASCADE` for collections and session history.

---

## 6. Preload Bridge & IPC Architecture (`src/main/preload.ts`)

The renderer interacts with the OS strictly via `window.stormPlay`:

```typescript
window.stormPlay = {
  games: {
    getAll: () => Promise<Game[]>,
    saveCustom: (game: Partial<Game>) => Promise<Game>,
    delete: (id: string) => Promise<boolean>,
    toggleFavorite: (id: string) => Promise<boolean>,
    update: (game: Game) => Promise<Game>
  },
  launcher: {
    play: (game: Game) => Promise<{ success: boolean; error?: string }>,
    kill: (gameId: string) => Promise<boolean>
  },
  scanner: {
    getSteamStatus: () => Promise<{ installed: boolean; libraries: string[] }>,
    scanSteam: () => Promise<Game[]>,
    scanEpic: () => Promise<Game[]>,
    scanGog: () => Promise<Game[]>,
    scanMultiLaunchers: () => Promise<Game[]>,
    scanFolder: (path: string) => Promise<Game[]>
  },
  steamgrid: {
    searchArtwork: (gameName: string) => Promise<any>,
    applyArtwork: (gameId: string, artwork: Partial<GameArtwork>) => Promise<Game>
  },
  collections: {
    getAll: () => Promise<Collection[]>,
    create: (name: string, color?: string) => Promise<Collection>,
    delete: (id: string) => Promise<boolean>,
    addGame: (collectionId: string, gameId: string) => Promise<boolean>,
    removeGame: (collectionId: string, gameId: string) => Promise<boolean>
  },
  stats: {
    getOverview: () => Promise<{ totalPlaytimeHours: number; sessionsCount: number }>,
    getRecentSessions: (limit: number) => Promise<GameSession[]>
  },
  settings: {
    get: () => Promise<LauncherSettings>,
    save: (settings: Partial<LauncherSettings>) => Promise<LauncherSettings>
  },
  window: {
    minimize: () => void,
    maximize: () => void,
    close: () => void
  }
}
```

---

## 7. Liquid Glass Design System (Framer Glasso Standard)

The design system implements a futuristic liquid glass aesthetic built upon optical refraction principles:

### 7.1 Optical Token Principles
1. **Backdrop Blurring**: High-radius Gaussian blur combined with color oversaturation:
   `backdrop-filter: blur(36px) saturate(190%); -webkit-backdrop-filter: blur(36px) saturate(190%);`
2. **Dual Specular Edges**:
   - Top edge specular light reflection: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.22)`
   - Subtle outer boundary line: `inset 0 0 0 1px rgba(255, 255, 255, 0.05)`
   - Floating elevation drop shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.45)`
3. **Monochrome Luxury Palette**:
   - **Dark Mode**: Pitch obsidian `#030305` base, crystal white `#FFFFFF` primary highlights, muted slate `#94A3B8` labels. **Zero neon or cyan accents.**
   - **Light Mode**: Frosted porcelain `#F8FAFC` base, deep obsidian `#09090B` typography.
4. **Spring Physics**:
   - Transitions do not use linear or standard ease. They utilize the Framer-standard spring curve:
     `cubic-bezier(0.16, 1, 0.3, 1)` with micro-durations (140ms to 240ms) for snappy, weightless tactile feedback.

### 7.2 Core CSS Utility Classes
- `.glass-card`: Interactive translucent container with specular top sheen and hover elevation.
- `.glass-panel`: Structural container for metric cards and modals with 36px blur.
- `.glass-toggle-track` & `.glass-toggle-knob`: Razor-sharp hardware-accelerated toggle switches with distinct high-contrast active states.
- `.glass-slider`: Translucent track with specular drop-shadow thumb.
- `.glass-input`: Obsidian inset container with 1px frosted boundary.

---

## 8. Virtualized 5-Column Grid Mathematics

In `src/renderer/pages/LibraryPage.tsx`, game cards are rendered using `react-window` to guarantee 60 FPS performance even with libraries containing 10,000+ games.

### Row Height Calculation:
```typescript
// Number of columns adjusts dynamically for small screens (3-5 columns)
const columnCount = size.width < 600 ? 3 : (size.width < 740 ? 4 : 5);
const columnWidth = Math.floor(size.width / columnCount);
const cardInnerWidth = Math.max(120, columnWidth - 16);

// Crucial: 16:9 compact mode and 2:3 standard grid mode dynamically calculate height
// to prevent any card overlap or text clipping:
const itemHeight = viewMode === 'compact'
  ? Math.round((cardInnerWidth * 9) / 16) + 88   // 16:9 aspect + 88px metadata footer
  : Math.round(cardInnerWidth * 1.5) + 88;       // 2:3 vertical aspect + 88px metadata footer
```

---

## 9. Audio Engine (`src/renderer/audio/soundEngine.ts`)

Storm Launcher incorporates a zero-dependency synthetic micro-sound engine powered directly by the HTML5 `AudioContext`:
- **Click Tone**: Fast 800Hz-to-400Hz exponential ramp over 0.04s.
- **Hover Tone**: Subtle 1200Hz sine pulse with gain attenuation (0.01s).
- **Launch Fanfare**: Harmonic chord progression synthesized on game startup.
- Automatically muted when `settings.soundEnabled === false`.

---

## 10. Development, Compilation & Packaging

### Commands:
- **Run in Development**: `npm run dev` (spawns Vite dev server with Electron hot reload).
- **TypeScript Check & Production Build**: `npm run build` (`tsc && vite build`).
- **Package Windows Installer / Portable Exe**: `npm run package` (invokes `electron-builder`).

### Guidelines for Future AI Modifiers:
1. **Theme Consistency**: Maintain the obsidian monochrome palette. Do not introduce neon cyan or saturated blue accents into buttons or toggles unless explicitly instructed by the user.
2. **Text Contrast**: Never set text colors using undefined CSS variables. Always use `var(--text-primary)`, `var(--text-secondary)`, or explicit `#FFFFFF` / `#09090B`.
3. **IPC Preservation**: Never delete or rename existing channels in `preload.ts` or `src/main/index.ts` without updating all renderer callers.
4. **Virtualization Safety**: When adding UI elements to `LibraryPage.tsx` or `GameCard.tsx`, always factor in their vertical pixels into the `itemHeight` calculation.
