import https from 'https';
import { execSync } from 'child_process';
import type {
  PlayerDossier,
  PlayerHeroStats,
  PlayerRecentMatch,
  SmurfThreatAnalysis,
  LobbyRoster,
  ModeWinrateStats,
  DebugMatchInfo
} from '../shared/types';
import { db } from './db';

interface OpenDotaHero {
  id: number;
  name: string;
  localized_name: string;
}

const KNOWN_HEROES: Record<number, { name: string; localized: string }> = {
  1: { name: 'antimage', localized: 'Anti-Mage' },
  2: { name: 'axe', localized: 'Axe' },
  3: { name: 'bane', localized: 'Bane' },
  4: { name: 'bloodseeker', localized: 'Bloodseeker' },
  5: { name: 'crystal_maiden', localized: 'Crystal Maiden' },
  6: { name: 'drow_ranger', localized: 'Drow Ranger' },
  7: { name: 'earthshaker', localized: 'Earthshaker' },
  8: { name: 'juggernaut', localized: 'Juggernaut' },
  9: { name: 'mirana', localized: 'Mirana' },
  10: { name: 'morphling', localized: 'Morphling' },
  11: { name: 'nevermore', localized: 'Shadow Fiend' },
  12: { name: 'phantom_lancer', localized: 'Phantom Lancer' },
  13: { name: 'puck', localized: 'Puck' },
  14: { name: 'pudge', localized: 'Pudge' },
  15: { name: 'razor', localized: 'Razor' },
  16: { name: 'sand_king', localized: 'Sand King' },
  17: { name: 'storm_spirit', localized: 'Storm Spirit' },
  18: { name: 'sven', localized: 'Sven' },
  19: { name: 'tiny', localized: 'Tiny' },
  20: { name: 'vengefulspirit', localized: 'Vengeful Spirit' },
  21: { name: 'windrunner', localized: 'Windranger' },
  22: { name: 'zuus', localized: 'Zeus' },
  23: { name: 'kunkka', localized: 'Kunkka' },
  25: { name: 'lina', localized: 'Lina' },
  26: { name: 'lion', localized: 'Lion' },
  27: { name: 'shadow_shaman', localized: 'Shadow Shaman' },
  28: { name: 'slardar', localized: 'Slardar' },
  29: { name: 'tidehunter', localized: 'Tidehunter' },
  30: { name: 'witch_doctor', localized: 'Witch Doctor' },
  31: { name: 'lich', localized: 'Lich' },
  32: { name: 'riki', localized: 'Riki' },
  33: { name: 'enigma', localized: 'Enigma' },
  34: { name: 'tinker', localized: 'Tinker' },
  35: { name: 'sniper', localized: 'Sniper' },
  36: { name: 'necrolyte', localized: 'Necrophos' },
  37: { name: 'warlock', localized: 'Warlock' },
  38: { name: 'beastmaster', localized: 'Beastmaster' },
  39: { name: 'queenofpain', localized: 'Queen of Pain' },
  40: { name: 'venomancer', localized: 'Venomancer' },
  41: { name: 'faceless_void', localized: 'Faceless Void' },
  42: { name: 'skeleton_king', localized: 'Wraith King' },
  43: { name: 'death_prophet', localized: 'Death Prophet' },
  44: { name: 'phantom_assassin', localized: 'Phantom Assassin' },
  45: { name: 'pugna', localized: 'Pugna' },
  46: { name: 'templar_assassin', localized: 'Templar Assassin' },
  47: { name: 'viper', localized: 'Viper' },
  48: { name: 'luna', localized: 'Luna' },
  49: { name: 'dragon_knight', localized: 'Dragon Knight' },
  50: { name: 'dazzle', localized: 'Dazzle' },
  51: { name: 'rattletrap', localized: 'Clockwerk' },
  52: { name: 'leshrac', localized: 'Leshrac' },
  53: { name: 'furion', localized: "Nature's Prophet" },
  54: { name: 'life_stealer', localized: 'Lifestealer' },
  55: { name: 'dark_seer', localized: 'Dark Seer' },
  56: { name: 'clinkz', localized: 'Clinkz' },
  57: { name: 'omniknight', localized: 'Omniknight' },
  58: { name: 'enchantress', localized: 'Enchantress' },
  59: { name: 'huskar', localized: 'Huskar' },
  60: { name: 'night_stalker', localized: 'Night Stalker' },
  61: { name: 'broodmother', localized: 'Broodmother' },
  62: { name: 'bounty_hunter', localized: 'Bounty Hunter' },
  63: { name: 'weaver', localized: 'Weaver' },
  64: { name: 'jakiro', localized: 'Jakiro' },
  65: { name: 'batrider', localized: 'Batrider' },
  66: { name: 'chen', localized: 'Chen' },
  67: { name: 'spectre', localized: 'Spectre' },
  68: { name: 'ancient_apparition', localized: 'Ancient Apparition' },
  69: { name: 'doom_bringer', localized: 'Doom' },
  70: { name: 'ursa', localized: 'Ursa' },
  71: { name: 'spirit_breaker', localized: 'Spirit Breaker' },
  72: { name: 'gyrocopter', localized: 'Gyrocopter' },
  73: { name: 'alchemist', localized: 'Alchemist' },
  74: { name: 'invoker', localized: 'Invoker' },
  75: { name: 'silencer', localized: 'Silencer' },
  76: { name: 'obsidian_destroyer', localized: 'Outworld Destroyer' },
  77: { name: 'lycan', localized: 'Lycan' },
  78: { name: 'brewmaster', localized: 'Brewmaster' },
  79: { name: 'shadow_demon', localized: 'Shadow Demon' },
  80: { name: 'lone_druid', localized: 'Lone Druid' },
  81: { name: 'chaos_knight', localized: 'Chaos Knight' },
  82: { name: 'meepo', localized: 'Meepo' },
  83: { name: 'treant', localized: 'Treant Protector' },
  84: { name: 'ogre_magi', localized: 'Ogre Magi' },
  85: { name: 'undying', localized: 'Undying' },
  86: { name: 'rubick', localized: 'Rubick' },
  87: { name: 'disruptor', localized: 'Disruptor' },
  88: { name: 'nyx_assassin', localized: 'Nyx Assassin' },
  89: { name: 'naga_siren', localized: 'Naga Siren' },
  90: { name: 'keeper_of_the_light', localized: 'Keeper of the Light' },
  91: { name: 'wisp', localized: 'Io' },
  92: { name: 'visage', localized: 'Visage' },
  93: { name: 'slark', localized: 'Slark' },
  94: { name: 'medusa', localized: 'Medusa' },
  95: { name: 'troll_warlord', localized: 'Troll Warlord' },
  96: { name: 'centaur', localized: 'Centaur Warrunner' },
  97: { name: 'magnataur', localized: 'Magnus' },
  98: { name: 'shredder', localized: 'Timbersaw' },
  99: { name: 'bristleback', localized: 'Bristleback' },
  100: { name: 'tusk', localized: 'Tusk' },
  101: { name: 'skywrath_mage', localized: 'Skywrath Mage' },
  102: { name: 'abaddon', localized: 'Abaddon' },
  103: { name: 'elder_titan', localized: 'Elder Titan' },
  104: { name: 'legion_commander', localized: 'Legion Commander' },
  105: { name: 'techies', localized: 'Techies' },
  106: { name: 'ember_spirit', localized: 'Ember Spirit' },
  107: { name: 'earth_spirit', localized: 'Earth Spirit' },
  108: { name: 'abyssal_underlord', localized: 'Underlord' },
  109: { name: 'terrorblade', localized: 'Terrorblade' },
  110: { name: 'phoenix', localized: 'Phoenix' },
  111: { name: 'oracle', localized: 'Oracle' },
  112: { name: 'winter_wyvern', localized: 'Winter Wyvern' },
  113: { name: 'arc_warden', localized: 'Arc Warden' },
  114: { name: 'monkey_king', localized: 'Monkey King' },
  119: { name: 'dark_willow', localized: 'Dark Willow' },
  120: { name: 'pangolier', localized: 'Pangolier' },
  121: { name: 'grimstroke', localized: 'Grimstroke' },
  123: { name: 'hoodwink', localized: 'Hoodwink' },
  126: { name: 'void_spirit', localized: 'Void Spirit' },
  128: { name: 'snapfire', localized: 'Snapfire' },
  129: { name: 'mars', localized: 'Mars' },
  135: { name: 'dawnbreaker', localized: 'Dawnbreaker' },
  136: { name: 'marci', localized: 'Marci' },
  137: { name: 'primal_beast', localized: 'Primal Beast' },
  138: { name: 'muerta', localized: 'Muerta' },
  145: { name: 'ringmaster', localized: 'Ringmaster' },
  155: { name: 'kez', localized: 'Kez' }
};

const RANK_NAMES: Record<number, string> = {
  1: 'Herald',
  2: 'Guardian',
  3: 'Crusader',
  4: 'Archon',
  5: 'Legend',
  6: 'Ancient',
  7: 'Divine',
  8: 'Immortal'
};

const RANK_NAMES_RU: Record<number, string> = {
  1: 'Рекрут',
  2: 'Страж',
  3: 'Рыцарь',
  4: 'Герой',
  5: 'Легенда',
  6: 'Властелин',
  7: 'Божество',
  8: 'Титан'
};

function httpsGetJson<T>(url: string, timeoutMs = 4500): Promise<T | null> {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        family: 4, // CRITICAL: force IPv4 to prevent IPv6 timeout on Windows
        headers: {
          'User-Agent': 'Storm-Launcher/1.4.0 (Windows)'
        },
        timeout: timeoutMs
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          res.resume();
          resolve(null);
          return;
        }

        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body) as T);
          } catch {
            resolve(null);
          }
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

export class InspectorService {
  private dossierCache = new Map<number, { data: PlayerDossier; timestamp: number }>();
  private CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private dynamicHeroes: Map<number, { name: string; localized: string }> = new Map();

  constructor() {
    this.initHeroConstants();
  }

  private async initHeroConstants() {
    try {
      const heroes = await httpsGetJson<OpenDotaHero[]>('https://api.opendota.com/api/heroes', 6000);
      if (heroes && Array.isArray(heroes)) {
        for (const h of heroes) {
          const clean = h.name.replace('npc_dota_hero_', '');
          this.dynamicHeroes.set(h.id, { name: clean, localized: h.localized_name });
        }
      }
    } catch {
      // Fallback to KNOWN_HEROES
    }
  }

  public getHeroInfo(heroId: number): { name: string; localized: string; icon: string } {
    const fromDynamic = this.dynamicHeroes.get(heroId);
    const fromStatic = KNOWN_HEROES[heroId];
    const name = fromDynamic?.name || fromStatic?.name || `hero_${heroId}`;
    const localized = fromDynamic?.localized || fromStatic?.localized || `Hero #${heroId}`;
    const icon = `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`;
    return { name, localized, icon };
  }

  public resolveAccountIds(input: string): number[] {
    const results: number[] = [];
    const seen = new Set<number>();

    const addId = (id: number) => {
      if (id > 0 && !seen.has(id)) {
        seen.add(id);
        results.push(id);
      }
    };

    if (!input || !input.trim()) return [];

    // 1. Check for Steam3 format: [U:1:12345678]
    const uMatch = input.matchAll(/\[U:1:(\d+)\]/gi);
    for (const m of uMatch) {
      addId(Number(m[1]));
    }

    // 2. Check for STEAM_0:0:12345 or STEAM_1:1:12345
    const steam2Match = input.matchAll(/STEAM_[0-5]:([0-1]):(\d+)/gi);
    for (const m of steam2Match) {
      const y = Number(m[1]);
      const z = Number(m[2]);
      const accId = z * 2 + y;
      addId(accId);
    }

    // 3. Check for Dotabuff or OpenDota URLs: dotabuff.com/players/123456
    const urlMatch = input.matchAll(/(?:dotabuff\.com|opendota\.com)\/players\/(\d+)/gi);
    for (const m of urlMatch) {
      addId(Number(m[1]));
    }

    // 4. Check for Steam community profiles: steamcommunity.com/profiles/(7656119\d{10})
    const steamUrlMatch = input.matchAll(/steamcommunity\.com\/profiles\/(7656119\d{10})/gi);
    for (const m of steamUrlMatch) {
      try {
        const id64 = BigInt(m[1]);
        const accId = Number(id64 - 76561197960265728n);
        addId(accId);
      } catch {}
    }

    // 5. Check for standalone SteamID64 (starts with 7656119)
    const steam64Match = input.matchAll(/\b(7656119\d{10})\b/g);
    for (const m of steam64Match) {
      try {
        const id64 = BigInt(m[1]);
        const accId = Number(id64 - 76561197960265728n);
        addId(accId);
      } catch {}
    }

    // 6. If no patterns matched yet, try extracting standalone numbers
    if (results.length === 0) {
      const numMatch = input.matchAll(/\b(\d{4,12})\b/g);
      for (const m of numMatch) {
        const val = Number(m[1]);
        if (val > 0 && val < 2147483647) {
          addId(val);
        }
      }
    }

    return results;
  }

  public getActiveSteamAccountId(): number | null {
    try {
      const cmd = 'Get-ItemProperty -Path "HKCU:\\Software\\Valve\\Steam\\ActiveProcess" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ActiveUser -First 1';
      const out = execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: 'utf8', timeout: 2500 }).trim();
      const num = Number(out);
      if (num && num > 0) return num;
    } catch {}

    return null;
  }

  public async getMyProfile(): Promise<PlayerDossier | null> {
    const activeId = this.getActiveSteamAccountId();
    if (!activeId) return null;
    return this.fetchPlayerDossier(activeId);
  }

  public async getDossier(queryOrId: string | number): Promise<PlayerDossier> {
    if (typeof queryOrId === 'number') {
      return this.fetchPlayerDossier(queryOrId);
    }

    const trimmed = queryOrId.trim();
    const resolved = this.resolveAccountIds(trimmed);
    if (resolved.length > 0) {
      return this.fetchPlayerDossier(resolved[0]);
    }

    // Fallback: search by nickname via OpenDota
    try {
      const searchRes = await httpsGetJson<Array<{ account_id: number; personaname: string }>>(
        `https://api.opendota.com/api/search?q=${encodeURIComponent(trimmed)}`,
        3500
      );
      if (searchRes && searchRes.length > 0 && searchRes[0].account_id) {
        return this.fetchPlayerDossier(searchRes[0].account_id);
      }
    } catch {}

    // Return empty fallback dossier
    return this.createFallbackDossier(0, trimmed, 'Игрок не найден');
  }

  public buildModeStats(wins: number, losses: number, isRu: boolean): ModeWinrateStats {
    const games = wins + losses;
    if (games <= 0) {
      return {
        winrate: null,
        wins: 0,
        losses: 0,
        games: 0,
        formatted: isRu ? 'Недостаточно данных' : 'Insufficient data',
        detailText: isRu ? '0 матчей' : '0 matches'
      };
    }
    const wr = Math.round((wins / games) * 100);
    return {
      winrate: wr,
      wins,
      losses,
      games,
      formatted: `${wr}%`,
      detailText: `${wins}W / ${losses}L`
    };
  }

  public async fetchPlayerDossier(accountId: number): Promise<PlayerDossier> {
    const cached = this.dossierCache.get(accountId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const lang = (db.getSettings().language || 'ru') as 'ru' | 'en';
    const isRu = lang === 'ru';

    // Parallel fetch: OpenDota player info, total WL, mode WLs, heroes, and recent matches
    const [profileData, wlData, rankedWlData, turboWlData, ap1WlData, ap22WlData, heroesData, matchesData] = await Promise.all([
      httpsGetJson<any>(`https://api.opendota.com/api/players/${accountId}`),
      httpsGetJson<any>(`https://api.opendota.com/api/players/${accountId}/wl`),
      httpsGetJson<any>(`https://api.opendota.com/api/players/${accountId}/wl?lobby_type=7`),
      httpsGetJson<any>(`https://api.opendota.com/api/players/${accountId}/wl?game_mode=23`),
      httpsGetJson<any>(`https://api.opendota.com/api/players/${accountId}/wl?game_mode=1`),
      httpsGetJson<any>(`https://api.opendota.com/api/players/${accountId}/wl?game_mode=22`),
      httpsGetJson<any[]>(`https://api.opendota.com/api/players/${accountId}/heroes`),
      httpsGetJson<any[]>(`https://api.opendota.com/api/players/${accountId}/matches?limit=30`)
    ]);

    const profile = profileData?.profile || {};
    const personaname = profile.personaname || `Player ${accountId}`;
    const avatar = profile.avatarfull || profile.avatarmedium || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
    const profileUrl = profile.profileurl || `https://steamcommunity.com/profiles/${profile.steamid || ''}`;
    const steamId64 = profile.steamid || (accountId > 0 ? (BigInt(accountId) + 76561197960265728n).toString() : undefined);

    const rankTier = profileData?.rank_tier || undefined;
    const leaderboardRank = profileData?.leaderboard_rank || undefined;

    let rankName: string | undefined = undefined;
    let rankStars: number | undefined = undefined;

    if (rankTier) {
      const tier = Math.floor(rankTier / 10);
      rankStars = rankTier % 10;
      const baseName = isRu ? (RANK_NAMES_RU[tier] || 'Ранг') : (RANK_NAMES[tier] || 'Rank');
      if (tier === 8) {
        rankName = leaderboardRank ? `Immortal #${leaderboardRank}` : (isRu ? 'Титан' : 'Immortal');
      } else {
        rankName = `${baseName} ${rankStars > 0 ? rankStars : ''}`.trim();
      }
    }

    // Authentic MMR: only use verified public competitive_rank, NEVER fabricate from medals!
    let exactMmr: number | null = null;
    if (typeof profileData?.profile?.competitive_rank === 'number' && profileData.profile.competitive_rank > 0) {
      exactMmr = profileData.profile.competitive_rank;
    } else if (typeof profileData?.solo_competitive_rank === 'number' && profileData.solo_competitive_rank > 0) {
      exactMmr = profileData.solo_competitive_rank;
    }
    const mmrDisplay = exactMmr !== null ? `${exactMmr}` : (isRu ? 'Недоступен публично' : 'Publicly unavailable');

    // Total games and winrate
    const wins = wlData?.win ?? 0;
    const losses = wlData?.lose ?? 0;
    const totalGames = wins + losses;
    const overallWinrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    // Distinct mode-specific calculations
    const rankedWins = rankedWlData?.win ?? 0;
    const rankedLosses = rankedWlData?.lose ?? 0;
    const rankedStats = this.buildModeStats(rankedWins, rankedLosses, isRu);

    const turboWins = turboWlData?.win ?? 0;
    const turboLosses = turboWlData?.lose ?? 0;
    const turboStats = this.buildModeStats(turboWins, turboLosses, isRu);

    // All Pick combines classic All Pick (game_mode=1) and Ranked All Pick (game_mode=22)
    const apWins = (ap1WlData?.win ?? 0) + (ap22WlData?.win ?? 0);
    const apLosses = (ap1WlData?.lose ?? 0) + (ap22WlData?.lose ?? 0);
    const allPickStats = this.buildModeStats(apWins, apLosses, isRu);

    // Check if profile is completely private in Dota 2 settings
    const isPrivate = totalGames === 0 && (!matchesData || matchesData.length === 0);

    // Top Signature heroes (3 - 5 heroes max, strictly filter out heroes with < 5 games)
    const topHeroes: PlayerHeroStats[] = [];
    if (Array.isArray(heroesData)) {
      const minGames = totalGames < 50 ? 3 : 5;
      const candidates = heroesData.filter(h => h.games >= minGames);

      candidates.sort((a, b) => {
        const scoreA = (a.win / a.games) * 60 + Math.min(40, a.games);
        const scoreB = (b.win / b.games) * 60 + Math.min(40, b.games);
        return scoreB - scoreA;
      });

      for (const h of candidates.slice(0, 4)) {
        const info = this.getHeroInfo(h.hero_id);
        const heroWr = Math.round((h.win / h.games) * 100);
        topHeroes.push({
          heroId: h.hero_id,
          heroName: isRu ? info.localized : info.name,
          heroIcon: info.icon,
          games: h.games,
          wins: h.win,
          winrate: heroWr
        });
      }
    }

    // Process recent matches and debug info
    const recentMatches: PlayerRecentMatch[] = [];
    const debugMatches: DebugMatchInfo[] = [];

    if (Array.isArray(matchesData)) {
      for (const m of matchesData.slice(0, 20)) {
        const info = this.getHeroInfo(m.hero_id);
        const won = (m.player_slot < 128 && m.radiant_win) || (m.player_slot >= 128 && !m.radiant_win);
        const k = m.kills ?? 0;
        const d = m.deaths ?? 0;
        const a = m.assists ?? 0;
        const kda = `${k}/${d}/${a}`;

        recentMatches.push({
          matchId: m.match_id,
          heroId: m.hero_id,
          heroName: isRu ? info.localized : info.name,
          heroIcon: info.icon,
          kills: k,
          deaths: d,
          assists: a,
          kda,
          won,
          durationSeconds: m.duration ?? 0,
          playedAt: (m.start_time ?? 0) * 1000
        });

        debugMatches.push({
          matchId: m.match_id,
          gameMode: m.game_mode ?? 0,
          lobbyType: m.lobby_type ?? 0,
          won,
          startTime: (m.start_time ?? 0) * 1000,
          heroId: m.hero_id,
          heroName: isRu ? info.localized : info.name,
          kills: k,
          deaths: d,
          assists: a,
          source: 'OpenDota API'
        });
      }
    }

    // Multi-factor smurf & threat analysis
    const smurfAnalysis = this.analyzeThreat(
      accountId,
      totalGames,
      overallWinrate,
      rankedStats,
      turboStats,
      allPickStats,
      rankTier,
      leaderboardRank,
      topHeroes,
      recentMatches,
      isPrivate,
      isRu
    );

    const dossier: PlayerDossier = {
      accountId,
      steamId64,
      name: personaname,
      avatar,
      profileUrl,
      isPrivate,
      rankTier,
      rankName,
      rankStars,
      leaderboardRank,
      exactMmr,
      mmrDisplay,
      wins,
      losses,
      totalGames,
      overallWinrate,
      rankedStats,
      turboStats,
      allPickStats,
      topHeroes,
      recentMatches,
      debugMatches,
      smurfAnalysis
    };

    this.dossierCache.set(accountId, { data: dossier, timestamp: Date.now() });
    return dossier;
  }

  private analyzeThreat(
    _accountId: number,
    totalGames: number,
    _overallWinrate: number,
    rankedStats: ModeWinrateStats,
    turboStats: ModeWinrateStats,
    allPickStats: ModeWinrateStats,
    rankTier: number | undefined,
    _leaderboardRank: number | undefined,
    topHeroes: PlayerHeroStats[],
    recentMatches: PlayerRecentMatch[],
    isPrivate: boolean,
    isRu: boolean
  ): SmurfThreatAnalysis {
    if (isPrivate) {
      return {
        isSmurfSuspect: false,
        smurfChancePercent: 0,
        suspicionLevel: 'clean',
        threatLevel: 'low',
        confidenceScore: 0,
        reasons: [isRu ? 'Профиль закрыт в настройках Dota 2' : 'Profile is private in Dota 2 settings'],
        winStreak: 0,
        loseStreak: 0,
        isOneTrickPony: false,
        recentWinrate: 0,
        summaryHeadline: isRu ? '🔒 Профиль закрыт настройками приватности' : '🔒 Match history hidden by player'
      };
    }

    const reasons: string[] = [];
    let score = 0;

    // Calculate streaks
    let winStreak = 0;
    let loseStreak = 0;
    let countingWin = true;
    let countingLose = true;

    for (const m of recentMatches) {
      if (m.won && countingWin) {
        winStreak++;
      } else {
        countingWin = false;
      }

      if (!m.won && countingLose) {
        loseStreak++;
      } else {
        countingLose = false;
      }

      if (!countingWin && !countingLose) break;
    }

    const recentWins = recentMatches.filter(m => m.won).length;
    const recentWinrate = recentMatches.length > 0 ? Math.round((recentWins / recentMatches.length) * 100) : 0;

    // Factor 1: Account age / total games vs rank
    const tier = rankTier ? Math.floor(rankTier / 10) : 0;
    if (totalGames > 0 && totalGames < 450 && tier >= 6) { // Ancient+ under 450 games
      score += 45;
      reasons.push(
        isRu
          ? `Мало игр (${totalGames}) при высоком ранге`
          : `Few games (${totalGames}) for high rank`
      );
    } else if (totalGames > 0 && totalGames < 250 && tier >= 4) { // Archon+ under 250 games
      score += 25;
      reasons.push(
        isRu
          ? `Свежий аккаунт: всего ${totalGames} матчей`
          : `Fresh account: only ${totalGames} matches`
      );
    }

    // Factor 2: Ranked winrate
    if (rankedStats.winrate !== null && rankedStats.games >= 15) {
      if (rankedStats.winrate >= 68) {
        score += 35;
        reasons.push(
          isRu
            ? `Высокий Ranked WR: ${rankedStats.formatted} (${rankedStats.detailText})`
            : `High Ranked WR: ${rankedStats.formatted} (${rankedStats.detailText})`
        );
      } else if (rankedStats.winrate >= 60) {
        score += 15;
      }
    }

    // Factor 3: Turbo winrate
    if (turboStats.winrate !== null && turboStats.games >= 15) {
      if (turboStats.winrate >= 65) {
        score += 25;
        reasons.push(
          isRu
            ? `Сильная статистика в Turbo: ${turboStats.formatted} (${turboStats.detailText})`
            : `High Turbo WR: ${turboStats.formatted} (${turboStats.detailText})`
        );
      } else if (turboStats.winrate >= 60) {
        score += 10;
      }
    }

    // Factor 4: All Pick winrate
    if (allPickStats.winrate !== null && allPickStats.games >= 20) {
      if (allPickStats.winrate >= 66) {
        score += 20;
        reasons.push(
          isRu
            ? `Высокий All Pick WR: ${allPickStats.formatted} (${allPickStats.detailText})`
            : `High All Pick WR: ${allPickStats.formatted} (${allPickStats.detailText})`
        );
      }
    }

    // Factor 5: Signature hero dominance
    let isOneTrickPony = false;
    let signatureHeroAlert: string | undefined = undefined;
    if (topHeroes.length > 0) {
      const best = topHeroes[0];
      if (best.games >= 15 && best.winrate >= 68) {
        isOneTrickPony = true;
        score += 20;
        signatureHeroAlert = isRu
          ? `Сигнатурка: ${best.heroName} (${best.games} игр · ${best.winrate}% WR)`
          : `Signature: ${best.heroName} (${best.games} games · ${best.winrate}% WR)`;
        reasons.push(signatureHeroAlert);
      }
    }

    // Factor 6: Hot form / winstreak
    if (winStreak >= 4) {
      score += Math.min(20, winStreak * 4);
      reasons.push(
        isRu
          ? `🔥 Винстрик: ${winStreak} побед подряд`
          : `🔥 Win streak: ${winStreak} wins in a row`
      );
    } else if (recentMatches.length >= 10 && recentWinrate >= 75) {
      score += 15;
      reasons.push(
        isRu
          ? `⚡ Горячая форма: ${recentWinrate}% за последние 20 игр`
          : `⚡ Hot form: ${recentWinrate}% in last 20 games`
      );
    }

    // Factor 7: Lose streak warning
    if (loseStreak >= 4) {
      reasons.push(
        isRu
          ? `❄️ Лузстрик: ${loseStreak} поражений подряд (тильт)`
          : `❄️ Lose streak: ${loseStreak} losses (tilt)`
      );
    }

    // Determine Suspicion Level (4 strict tiers)
    let suspicionLevel: 'high_smurf' | 'high_suspicion' | 'suspicious' | 'clean' = 'clean';
    let threatLevel: 'low' | 'medium' | 'high' = 'low';

    if (score >= 60) {
      suspicionLevel = 'high_smurf';
      threatLevel = 'high';
    } else if (score >= 40) {
      suspicionLevel = 'high_suspicion';
      threatLevel = 'high';
    } else if (score >= 20) {
      suspicionLevel = 'suspicious';
      threatLevel = 'medium';
    } else {
      suspicionLevel = 'clean';
      threatLevel = 'low';
    }

    const smurfChancePercent = Math.min(96, Math.max(5, score));
    const isSmurfSuspect = suspicionLevel === 'high_smurf' || suspicionLevel === 'high_suspicion';

    // Confidence score based on total games volume
    let confidenceScore = 35;
    if (totalGames >= 1500) confidenceScore = 92;
    else if (totalGames >= 500) confidenceScore = 85;
    else if (totalGames >= 150) confidenceScore = 75;
    else if (totalGames >= 30) confidenceScore = 60;

    // Headline
    let summaryHeadline = '';
    if (suspicionLevel === 'high_smurf') {
      summaryHeadline = isRu ? '🔴 ВЫСОКИЙ ШАНС НА СМУРФ' : '🔴 HIGH SMURF CHANCE';
    } else if (suspicionLevel === 'high_suspicion') {
      summaryHeadline = isRu ? '🟠 ПОВЫШЕННОЕ ПОДОЗРЕНИЕ' : '🟠 ELEVATED SUSPICION';
    } else if (suspicionLevel === 'suspicious') {
      summaryHeadline = isRu ? '🟡 ЕСТЬ ПОДОЗРИТЕЛЬНЫЕ ПРИЗНАКИ' : '🟡 SUSPICIOUS SIGNS';
    } else {
      summaryHeadline = isRu ? '🟢 ПОДОЗРИТЕЛЬНЫХ ПРИЗНАКОВ НЕ НАЙДЕНО' : '🟢 CLEAN ACCOUNT';
    }

    // Keep only top 2-4 most critical reasons
    const cleanReasons = reasons.slice(0, 4);

    return {
      isSmurfSuspect,
      smurfChancePercent,
      suspicionLevel,
      threatLevel,
      confidenceScore,
      reasons: cleanReasons,
      winStreak,
      loseStreak,
      isOneTrickPony,
      signatureHeroAlert,
      recentWinrate,
      summaryHeadline
    };
  }

  public async parseLobby(rawText: string): Promise<LobbyRoster> {
    const accountIds = this.resolveAccountIds(rawText);

    const dossiers: PlayerDossier[] = [];
    // Concurrency limit: fetch in chunks of 5 to respect OpenDota rate-limits
    for (let i = 0; i < accountIds.length; i += 5) {
      const chunk = accountIds.slice(i, i + 5);
      const results = await Promise.allSettled(chunk.map(id => this.fetchPlayerDossier(id)));
      for (let j = 0; j < results.length; j++) {
        const res = results[j];
        if (res.status === 'fulfilled') {
          dossiers.push(res.value);
        } else {
          dossiers.push(this.createFallbackDossier(chunk[j], `Player ${chunk[j]}`, 'Ошибка загрузки'));
        }
      }
    }

    // Split into Radiant (first 5), Dire (next 5), unassigned (rest)
    const radiant: PlayerDossier[] = [];
    const dire: PlayerDossier[] = [];
    const unassigned: PlayerDossier[] = [];

    for (let i = 0; i < dossiers.length; i++) {
      const p = dossiers[i];
      if (i < 5) {
        p.team = 'radiant';
        radiant.push(p);
      } else if (i < 10) {
        p.team = 'dire';
        dire.push(p);
      } else {
        p.team = 'unassigned';
        unassigned.push(p);
      }
    }

    const smurfCount = dossiers.filter(d => d.smurfAnalysis.isSmurfSuspect).length;
    const privateCount = dossiers.filter(d => d.isPrivate).length;

    return {
      radiant,
      dire,
      unassigned,
      totalPlayers: dossiers.length,
      smurfCount,
      privateCount
    };
  }

  private createFallbackDossier(accountId: number, name: string, reason: string): PlayerDossier {
    const isRu = (db.getSettings().language || 'ru') === 'ru';
    const emptyStats = this.buildModeStats(0, 0, isRu);
    return {
      accountId,
      name,
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      profileUrl: accountId > 0 ? `https://steamcommunity.com/profiles/${BigInt(accountId) + 76561197960265728n}` : '',
      isPrivate: true,
      exactMmr: null,
      mmrDisplay: isRu ? 'Недоступен публично' : 'Publicly unavailable',
      wins: 0,
      losses: 0,
      totalGames: 0,
      overallWinrate: 0,
      rankedStats: emptyStats,
      turboStats: emptyStats,
      allPickStats: emptyStats,
      topHeroes: [],
      recentMatches: [],
      smurfAnalysis: {
        isSmurfSuspect: false,
        smurfChancePercent: 0,
        suspicionLevel: 'clean',
        threatLevel: 'low',
        confidenceScore: 0,
        reasons: [reason],
        winStreak: 0,
        loseStreak: 0,
        isOneTrickPony: false,
        recentWinrate: 0,
        summaryHeadline: '🔒 ' + reason
      }
    };
  }
}

export const inspectorService = new InspectorService();

