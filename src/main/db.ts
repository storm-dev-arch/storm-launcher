import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { Game, SessionRecord, CollectionRecord, LauncherSettings, LauncherStats } from '../shared/types';

export class DatabaseService {
  private baseDir: string;
  private dbDir: string;
  private cacheDir: string;

  private gamesMap: Map<string, Game> = new Map();
  private sessions: SessionRecord[] = [];
  private collections: CollectionRecord[] = [];
  private settings: LauncherSettings;

  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'StormPlay');
    this.dbDir = path.join(this.baseDir, 'database');
    this.cacheDir = path.join(this.baseDir, 'cache', 'artwork');

    this.ensureDirs();
    this.settings = this.loadSettings();
    this.loadAll();
  }

  public getCacheDir(): string {
    return this.cacheDir;
  }

  private ensureDirs() {
    if (!fs.existsSync(this.dbDir)) fs.mkdirSync(this.dbDir, { recursive: true });
    if (!fs.existsSync(this.cacheDir)) fs.mkdirSync(this.cacheDir, { recursive: true });

    try {
      const legacyDbDir = path.join(app.getPath('appData'), 'storm-play', 'StormPlay', 'database');
      if (fs.existsSync(legacyDbDir) && !fs.existsSync(path.join(this.dbDir, 'games.json'))) {
        const files = ['games.json', 'sessions.json', 'collections.json', 'settings.json'];
        for (const f of files) {
          const src = path.join(legacyDbDir, f);
          const dest = path.join(this.dbDir, f);
          if (fs.existsSync(src) && !fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    } catch {}
  }

  private loadSettings(): LauncherSettings {
    const file = path.join(this.dbDir, 'settings.json');
    const defaultSettings: LauncherSettings = {
      theme: 'obsidian',
      glassIntensity: 0.85,
      blurAmount: 24,
      cardOpacity: 0.65,
      borderOpacity: 0.08,
      cornerRadius: 12,
      animationIntensity: 'normal',
      dynamicBackground: true,
      startWithWindows: false,
      startMinimized: false,
      steamPaths: [],
      customScanPaths: [],
      defaultView: 'grid',
      sortBy: 'recent',
      firstLaunchDone: false,
      language: 'ru',
      discordRPC: true,
      soundEnabled: true,
      soundVolume: 0.75
    };

    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        return { ...defaultSettings, ...JSON.parse(raw) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  }

  private loadAll() {
    const gamesFile = path.join(this.dbDir, 'games.json');
    if (fs.existsSync(gamesFile)) {
      try {
        const list: Game[] = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
        for (const g of list) {
          this.gamesMap.set(g.id, g);
        }
      } catch (e) {
        console.error('Failed to load games.json:', e);
      }
    }

    const sessionsFile = path.join(this.dbDir, 'sessions.json');
    if (fs.existsSync(sessionsFile)) {
      try {
        this.sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      } catch (e) {
        console.error('Failed to load sessions.json:', e);
      }
    }

    const collectionsFile = path.join(this.dbDir, 'collections.json');
    if (fs.existsSync(collectionsFile)) {
      try {
        this.collections = JSON.parse(fs.readFileSync(collectionsFile, 'utf8'));
      } catch (e) {
        console.error('Failed to load collections.json:', e);
      }
    }
  }

  private saveFile(filename: string, data: any) {
    const filePath = path.join(this.dbDir, filename);
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  public getGames(): Game[] {
    return Array.from(this.gamesMap.values());
  }

  public getGame(id: string): Game | null {
    return this.gamesMap.get(id) || null;
  }

  public saveGame(game: Game): Game {
    this.gamesMap.set(game.id, game);
    this.saveFile('games.json', Array.from(this.gamesMap.values()));
    return game;
  }

  public upsertGames(newGames: Game[]): Game[] {
    for (const g of newGames) {
      const existing = this.gamesMap.get(g.id);
      if (existing) {
        this.gamesMap.set(g.id, {
          ...g,
          favorite: existing.favorite,
          collections: Array.from(new Set([...(existing.collections || []), ...(g.collections || [])])),
          playtimeMinutes: Math.max(existing.playtimeMinutes, g.playtimeMinutes),
          lastPlayed: Math.max(existing.lastPlayed || 0, g.lastPlayed || 0) || undefined,
          launchCount: existing.launchCount || g.launchCount || 0,
          totalSessionTimeMinutes: existing.totalSessionTimeMinutes || 0
        });
      } else {
        this.gamesMap.set(g.id, g);
      }
    }
    this.saveFile('games.json', Array.from(this.gamesMap.values()));
    return Array.from(this.gamesMap.values());
  }

  public deleteGame(id: string): boolean {
    const res = this.gamesMap.delete(id);
    if (res) {
      this.saveFile('games.json', Array.from(this.gamesMap.values()));
    }
    return res;
  }

  public toggleFavorite(id: string): Game | null {
    const game = this.gamesMap.get(id);
    if (!game) return null;
    game.favorite = !game.favorite;
    this.gamesMap.set(id, game);
    this.saveFile('games.json', Array.from(this.gamesMap.values()));
    return game;
  }

  public getSessions(): SessionRecord[] {
    return [...this.sessions].sort((a, b) => b.startTime - a.startTime);
  }

  public addSession(session: SessionRecord) {
    this.sessions.unshift(session);
    if (this.sessions.length > 1000) {
      this.sessions = this.sessions.slice(0, 1000);
    }
    this.saveFile('sessions.json', this.sessions);
  }

  public getCollections(): CollectionRecord[] {
    return [...this.collections];
  }

  public saveCollection(col: CollectionRecord): CollectionRecord {
    const idx = this.collections.findIndex(c => c.id === col.id);
    if (idx >= 0) {
      this.collections[idx] = col;
    } else {
      this.collections.push(col);
    }
    this.saveFile('collections.json', this.collections);
    return col;
  }

  public deleteCollection(id: string): boolean {
    this.collections = this.collections.filter(c => c.id !== id);
    this.saveFile('collections.json', this.collections);

    for (const g of this.gamesMap.values()) {
      if (g.collections && g.collections.includes(id)) {
        g.collections = g.collections.filter(cId => cId !== id);
      }
    }
    this.saveFile('games.json', Array.from(this.gamesMap.values()));
    return true;
  }

  public getSettings(): LauncherSettings {
    return { ...this.settings };
  }

  public saveSettings(partial: Partial<LauncherSettings>): LauncherSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveFile('settings.json', this.settings);
    return { ...this.settings };
  }

  public getStats(): LauncherStats {
    const games = Array.from(this.gamesMap.values());
    const totalPlaytimeMinutes = games.reduce((acc, g) => acc + (g.playtimeMinutes || 0), 0);
    const mostPlayed = [...games].sort((a, b) => (b.playtimeMinutes || 0) - (a.playtimeMinutes || 0)).slice(0, 5);

    const playtimeByDay: { [key: string]: number } = {};
    for (const s of this.sessions) {
      const dateKey = new Date(s.startTime).toISOString().split('T')[0];
      playtimeByDay[dateKey] = (playtimeByDay[dateKey] || 0) + s.durationMinutes;
    }

    return {
      totalGames: games.length,
      installedGames: games.filter(g => g.installed).length,
      customGames: games.filter(g => g.custom).length,
      steamGames: games.filter(g => g.source === 'steam').length,
      totalPlaytimeMinutes,
      recentSessions: this.sessions.slice(0, 10),
      mostPlayed,
      playtimeByDay
    };
  }
}

export const db = new DatabaseService();
