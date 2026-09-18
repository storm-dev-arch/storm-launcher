import http from 'http';
import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';
import { discordRPC, DOTA2_ICON_URL } from './discordRPC';
import { db } from './db';

const DOTA_HEROES: Record<string, { ru: string; en: string }> = {
  nevermore: { ru: 'Shadow Fiend (СФ)', en: 'Shadow Fiend' },
  invoker: { ru: 'Инвокер', en: 'Invoker' },
  pudge: { ru: 'Пудж', en: 'Pudge' },
  antimage: { ru: 'Антимаг', en: 'Anti-Mage' },
  axe: { ru: 'Акс', en: 'Axe' },
  crystal_maiden: { ru: 'Crystal Maiden (ЦМ)', en: 'Crystal Maiden' },
  juggernaut: { ru: 'Джаггернаут', en: 'Juggernaut' },
  phantom_assassin: { ru: 'Phantom Assassin (Фантомка)', en: 'Phantom Assassin' },
  faceless_void: { ru: 'Faceless Void (Войд)', en: 'Faceless Void' },
  sniper: { ru: 'Снайпер', en: 'Sniper' },
  storm_spirit: { ru: 'Шторм Спирит', en: 'Storm Spirit' },
  zuus: { ru: 'Зевс', en: 'Zeus' },
  tinker: { ru: 'Тинкер', en: 'Tinker' },
  rubick: { ru: 'Рубик', en: 'Rubick' },
  ursa: { ru: 'Урса', en: 'Ursa' },
  slark: { ru: 'Сларк', en: 'Slark' },
  shredder: { ru: 'Тимбер', en: 'Timbersaw' },
  rattletrap: { ru: 'Клокверк', en: 'Clockwerk' },
  obsidian_destroyer: { ru: 'Outworld Destroyer (ОД)', en: 'Outworld Destroyer' },
  windrunner: { ru: 'Виндрейнджер (ВР)', en: 'Windranger' },
  necrolyte: { ru: 'Некрофос', en: 'Necrophos' },
  skeleton_king: { ru: 'Врач Кинг (ВК)', en: 'Wraith King' },
  wisp: { ru: 'Ио (Висп)', en: 'IO' },
  furion: { ru: 'Фурион', en: "Nature's Prophet" },
  queenofpain: { ru: 'Квопа (QoP)', en: 'Queen of Pain' },
  shadow_demon: { ru: 'Шэдоу Демон', en: 'Shadow Demon' },
  terrorblade: { ru: 'Террорблейд (ТБ)', en: 'Terrorblade' },
  lina: { ru: 'Лина', en: 'Lina' },
  lion: { ru: 'Лион', en: 'Lion' },
  mirana: { ru: 'Мирана', en: 'Mirana' },
  morphling: { ru: 'Морфлинг', en: 'Morphling' },
  phantom_lancer: { ru: 'Фантом Лансер (ПЛ)', en: 'Phantom Lancer' },
  riki: { ru: 'Рики', en: 'Riki' },
  sven: { ru: 'Свен', en: 'Sven' },
  tiny: { ru: 'Тини', en: 'Tiny' },
  viper: { ru: 'Вайпер', en: 'Viper' },
  weaver: { ru: 'Вивер', en: 'Weaver' },
  witch_doctor: { ru: 'Витч Доктор', en: 'Witch Doctor' },
  meepo: { ru: 'Мипо', en: 'Meepo' },
  bloodseeker: { ru: 'Сикер (Bloodseeker)', en: 'Bloodseeker' },
  drow_ranger: { ru: 'Тракса (Drow Ranger)', en: 'Drow Ranger' },
  earthshaker: { ru: 'Шейкер', en: 'Earthshaker' },
  kunkka: { ru: 'Кункка', en: 'Kunkka' },
  slardar: { ru: 'Слардар', en: 'Slardar' },
  tidehunter: { ru: 'Тайдхантер', en: 'Tidehunter' },
  bounty_hunter: { ru: 'Баунти Хантер (БХ)', en: 'Bounty Hunter' },
  spectre: { ru: 'Спектра', en: 'Spectre' },
  spirit_breaker: { ru: 'Бара (Баратрум)', en: 'Spirit Breaker' },
  doom_bringer: { ru: 'Дум', en: 'Doom' },
  ogre_magi: { ru: 'Огр Маг', en: 'Ogre Magi' },
  alchemist: { ru: 'Алхимик', en: 'Alchemist' },
  legion_commander: { ru: 'Легионка (LC)', en: 'Legion Commander' },
  abaddon: { ru: 'Абаддон', en: 'Abaddon' },
  monkey_king: { ru: 'МК (Monkey King)', en: 'Monkey King' },
  pangolier: { ru: 'Пангольер', en: 'Pangolier' },
  grimstroke: { ru: 'Гримстроук', en: 'Grimstroke' },
  void_spirit: { ru: 'Войд Спирит', en: 'Void Spirit' },
  snapfire: { ru: 'Бабка (Snapfire)', en: 'Snapfire' },
  hoodwink: { ru: 'Белка (Hoodwink)', en: 'Hoodwink' },
  marci: { ru: 'Марси', en: 'Marci' },
  primal_beast: { ru: 'Праймал Бист', en: 'Primal Beast' },
  muerta: { ru: 'Муэрта', en: 'Muerta' },
  ringmaster: { ru: 'Рингмастер', en: 'Ringmaster' },
  kez: { ru: 'Кез', en: 'Kez' }
};

function formatDotaHero(rawName: string, lang: 'ru' | 'en'): string {
  if (!rawName) return lang === 'ru' ? 'В меню' : 'In Menu';
  const clean = rawName.replace('npc_dota_hero_', '').toLowerCase();
  if (DOTA_HEROES[clean]) {
    return DOTA_HEROES[clean][lang] || DOTA_HEROES[clean].en;
  }
  return clean.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatCSMap(rawMap: string, lang: 'ru' | 'en'): string {
  if (!rawMap) return lang === 'ru' ? 'В меню' : 'In Menu';
  const clean = rawMap.replace('de_', '').replace('cs_', '').toLowerCase();
  const maps: Record<string, { ru: string; en: string }> = {
    dust2: { ru: 'Dust II', en: 'Dust II' },
    mirage: { ru: 'Mirage', en: 'Mirage' },
    inferno: { ru: 'Inferno', en: 'Inferno' },
    nuke: { ru: 'Nuke', en: 'Nuke' },
    overpass: { ru: 'Overpass', en: 'Overpass' },
    ancient: { ru: 'Ancient', en: 'Ancient' },
    anubis: { ru: 'Anubis', en: 'Anubis' },
    vertigo: { ru: 'Vertigo', en: 'Vertigo' },
    office: { ru: 'Office', en: 'Office' },
    italy: { ru: 'Italy', en: 'Italy' }
  };
  if (maps[clean]) return maps[clean][lang];
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export interface LiveGameStats {
  game: 'dota2' | 'cs2';
  title: string;
  details: string;
  state: string;
  heroOrMap?: string;
  scoreOrKDA?: string;
  matchTime?: string;
}

export class GSIService {
  private server: http.Server | null = null;
  private port = 31337;
  private mainWindow: BrowserWindow | null = null;
  private lastStats: LiveGameStats | null = null;
  private lastPacketTime = 0;
  private lastRawData: { type: 'dota2' | 'cs2'; data: any } | null = null;

  public setWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  public installGSIConfigs(libraries: string[]) {
    const dotaCfgContent = `"Storm Launcher GSI"
{
    "uri"               "http://127.0.0.1:${this.port}/dota2"
    "timeout"           "5.0"
    "buffer"            "0.1"
    "throttle"          "0.1"
    "heartbeat"         "1.0"
    "data"
    {
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
        "abilities"     "1"
        "items"         "1"
        "draft"         "1"
    }
}
`;

    const cs2CfgContent = `"Storm Launcher CS2 GSI"
{
    "uri"               "http://127.0.0.1:${this.port}/cs2"
    "timeout"           "5.0"
    "buffer"            "0.1"
    "throttle"          "0.1"
    "heartbeat"         "1.0"
    "data"
    {
        "provider"            "1"
        "map"                 "1"
        "round"               "1"
        "player_id"           "1"
        "player_state"        "1"
        "player_match_stats"  "1"
    }
}
`;

    for (const lib of libraries) {
      try {
        const dotaCfgDir = path.join(lib, 'steamapps', 'common', 'dota 2 beta', 'game', 'dota', 'cfg');
        if (fs.existsSync(dotaCfgDir)) {
          fs.writeFileSync(path.join(dotaCfgDir, 'gamestate_integration_storm.cfg'), dotaCfgContent, 'utf8');
          const subDir = path.join(dotaCfgDir, 'gamestate_integration');
          if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
          fs.writeFileSync(path.join(subDir, 'gamestate_integration_storm.cfg'), dotaCfgContent, 'utf8');
        }

        const cs2CfgDir = path.join(lib, 'steamapps', 'common', 'Counter-Strike Global Offensive', 'game', 'csgo', 'cfg');
        if (fs.existsSync(cs2CfgDir)) {
          fs.writeFileSync(path.join(cs2CfgDir, 'gamestate_integration_storm.cfg'), cs2CfgContent, 'utf8');
        }
      } catch (err) {
        console.warn('GSI config install error:', err);
      }
    }

    try {
      const games = db.getGames();
      const dotaGame = games.find(g => g.steamAppId === 570 || g.name.toLowerCase().includes('dota'));
      if (dotaGame && dotaGame.installPath && fs.existsSync(dotaGame.installPath)) {
        const dotaCfgDir = path.join(dotaGame.installPath, 'game', 'dota', 'cfg');
        if (fs.existsSync(dotaCfgDir)) {
          const subDir = path.join(dotaCfgDir, 'gamestate_integration');
          if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
          fs.writeFileSync(path.join(subDir, 'gamestate_integration_storm.cfg'), dotaCfgContent, 'utf8');
          fs.writeFileSync(path.join(dotaCfgDir, 'gamestate_integration_storm.cfg'), dotaCfgContent, 'utf8');
        }
      }
    } catch {}
  }

  public startServer() {
    if (this.server) return;

    this.server = http.createServer((req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end();
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 2e6) req.destroy();
      });

      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');

        try {
          const data = JSON.parse(body);
          const url = (req.url || '').toLowerCase();
          const isDota = url.includes('dota') || data.hero || data.buildings || data.provider?.name?.toLowerCase().includes('dota');
          const isCS = url.includes('cs') || data.round || data.provider?.name?.toLowerCase().includes('counter-strike');

          if (isDota) {
            this.handleDotaData(data);
          } else if (isCS) {
            this.handleCS2Data(data);
          }
        } catch (e) {}
      });
    });

    this.server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`GSI Port ${this.port} is in use, will retry on next start.`);
      }
    });

    this.server.listen(this.port, '127.0.0.1', () => {
      console.log(`Storm GSI Server running on http://127.0.0.1:${this.port}`);
    });
  }

  public isLive(): boolean {
    return Date.now() - this.lastPacketTime < 25000;
  }

  public markInactive() {
    this.lastPacketTime = 0;
    this.lastStats = null;
    this.lastRawData = null;
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('play:gsi:update', null);
    }
  }

  public refreshLanguage() {
    if (this.isLive() && this.lastRawData) {
      if (this.lastRawData.type === 'dota2') {
        this.handleDotaData(this.lastRawData.data);
      } else {
        this.handleCS2Data(this.lastRawData.data);
      }
    }
  }

  private handleDotaData(data: any) {
    this.lastPacketTime = Date.now();
    this.lastRawData = { type: 'dota2', data };

    const lang: 'ru' | 'en' = db.getSettings().language || 'ru';
    const isRu = lang === 'ru';
    const heroRaw = data.hero?.name || '';
    const cleanHero = heroRaw.replace('npc_dota_hero_', '').toLowerCase();
    const heroName = formatDotaHero(heroRaw, lang);
    const kills = data.player?.kills ?? 0;
    const deaths = data.player?.deaths ?? 0;
    const assists = data.player?.assists ?? 0;
    const level = data.hero?.level ?? 1;

    const mapName = (data.map?.name || '').toLowerCase();
    const isDemo = mapName.includes('demo') || mapName.includes('training') || mapName.includes('hero_demo');
    const gameState = data.map?.game_state || '';
    const isPaused = Boolean(data.map?.paused);

    // Use clock_time (real match timer) when available, fallback to game_time
    const clockTime = data.map?.clock_time;
    const gameTime = data.map?.game_time || 0;
    const activeSec = (clockTime !== undefined && !isDemo) ? Math.floor(clockTime) : Math.floor(gameTime);

    let timeStr = '';
    if (activeSec < 0) {
      const abs = Math.abs(activeSec);
      const m = Math.floor(abs / 60);
      const s = abs % 60;
      timeStr = `-${m}:${s < 10 ? '0' : ''}${s}`;
    } else {
      const m = Math.floor(activeSec / 60);
      const s = activeSec % 60;
      timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    const kdaStr = `${kills}/${deaths}/${assists}`;
    let details = '';
    let state = '';
    let startTimestamp: number | undefined = undefined;

    const isDraft = gameState === 'DOTA_GAMERULES_STATE_HERO_SELECTION';
    const isStrategy = gameState === 'DOTA_GAMERULES_STATE_STRATEGY_TIME' || gameState === 'DOTA_GAMERULES_STATE_TEAM_SHOWCASE';
    const isPreGame = gameState === 'DOTA_GAMERULES_STATE_PRE_GAME' || (clockTime !== undefined && clockTime < 0);
    const isPostGame = gameState.includes('POST_GAME');

    if (isDemo) {
      details = heroRaw ? `Dota 2: ${heroName}` : 'Dota 2: Hero Demo';
      state = isRu
        ? `Демо-режим • ${kdaStr} KDA • ${timeStr}`
        : `Hero Demo • ${kdaStr} KDA • ${timeStr}`;
      if (!isPaused && activeSec >= 0) {
        startTimestamp = Date.now() - (activeSec * 1000);
      }
    } else if (isDraft) {
      details = isRu ? 'Dota 2: Выбор героев' : 'Dota 2: Hero Selection';
      state = isRu ? 'Стадия пиков и банов' : 'Bans & Picks Phase';
    } else if (isStrategy) {
      details = heroRaw ? `Dota 2: ${heroName}` : (isRu ? 'Dota 2: Подготовка' : 'Dota 2: Strategy Phase');
      state = isRu ? 'Подготовка к выходу на карту' : 'Strategy & Showcase';
    } else if (isPreGame) {
      details = heroRaw
        ? `Dota 2: ${heroName} (${level} ${isRu ? 'ур.' : 'Lvl'})`
        : (isRu ? 'Dota 2: Разминка' : 'Dota 2: Pre-Game');
      state = isRu
        ? `Сбор рун (${timeStr}) • ${kdaStr} KDA`
        : `Rune Phase (${timeStr}) • ${kdaStr} KDA`;
    } else if (isPostGame) {
      details = heroRaw ? `Dota 2: ${heroName}` : 'Dota 2';
      state = isRu ? `Матч завершен • ${kdaStr} KDA` : `Match Ended • ${kdaStr} KDA`;
    } else if (heroRaw) {
      details = `Dota 2: ${heroName} (${level} ${isRu ? 'ур.' : 'Lvl'})`;
      state = isRu
        ? `Счет: ${kdaStr} KDA • ${timeStr}${isPaused ? ' (Пауза)' : ''}`
        : `Score: ${kdaStr} KDA • ${timeStr}${isPaused ? ' (Paused)' : ''}`;
      if (!isPaused && activeSec >= 0) {
        startTimestamp = Date.now() - (activeSec * 1000);
      }
    } else {
      details = isRu ? 'Dota 2: Главное меню' : 'Dota 2: Main Menu';
      state = isRu ? 'В главном меню' : 'In Main Menu';
    }

    this.lastStats = {
      game: 'dota2',
      title: 'Dota 2',
      details,
      state,
      heroOrMap: heroName,
      scoreOrKDA: kdaStr,
      matchTime: timeStr
    };

    const heroIconUrl = heroRaw
      ? `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${cleanHero}.png`
      : undefined;

    discordRPC.setActivity({
      details,
      state,
      startTimestamp,
      largeImageKey: DOTA2_ICON_URL,
      largeImageText: heroRaw ? `Dota 2 • ${heroName}` : 'Dota 2',
      smallImageKey: heroIconUrl,
      smallImageText: heroRaw ? heroName : 'Storm Launcher',
      buttons: [
        { label: isRu ? 'Скачать Storm Launcher' : 'Get Storm Launcher', url: 'https://github.com/storm-dev-arch/storm-launcher' }
      ]
    });

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('play:gsi:update', this.lastStats);
    }
  }

  private handleCS2Data(data: any) {
    this.lastPacketTime = Date.now();
    this.lastRawData = { type: 'cs2', data };

    const lang: 'ru' | 'en' = db.getSettings().language || 'ru';
    const rawMap = data.map?.name || '';
    const mapName = formatCSMap(rawMap, lang);
    const mode = data.map?.mode || 'competitive';
    const ctScore = data.map?.team_ct?.score ?? 0;
    const tScore = data.map?.team_t?.score ?? 0;

    const kills = data.player?.match_stats?.kills ?? 0;
    const deaths = data.player?.match_stats?.deaths ?? 0;
    const assists = data.player?.match_stats?.assists ?? 0;

    const kdaStr = `${kills}/${deaths}/${assists}`;
    const scoreStr = `${ctScore} : ${tScore}`;

    const details = rawMap
      ? `CS2: ${mapName} (${scoreStr})`
      : (lang === 'ru' ? 'Counter-Strike 2: Главное меню' : 'Counter-Strike 2: Main Menu');

    const state = rawMap
      ? `${lang === 'ru' ? 'Счет' : 'Score'}: ${kdaStr} KDA • ${mode}`
      : (lang === 'ru' ? 'В лобби' : 'In Lobby');

    this.lastStats = {
      game: 'cs2',
      title: 'Counter-Strike 2',
      details,
      state,
      heroOrMap: mapName,
      scoreOrKDA: scoreStr,
      matchTime: undefined
    };

    discordRPC.setActivity({
      details,
      state,
      largeImageKey: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
      largeImageText: `CS2 • ${mapName}`,
      smallImageText: 'Storm Launcher'
    });

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('play:gsi:update', this.lastStats);
    }
  }

  public getStats(): LiveGameStats | null {
    return this.lastStats;
  }
}

export const gsiService = new GSIService();
