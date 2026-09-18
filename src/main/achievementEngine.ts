import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import type { AchievementItem } from '../shared/types';

export class AchievementEngine {
  private cache = new Map<number, { total: number; unlocked: number; items: AchievementItem[]; timestamp: number }>();
  private cachePath: string;

  constructor() {
    this.cachePath = path.join(app.getPath('userData'), 'StormPlay', 'database', 'achievements.json');
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
        for (const key of Object.keys(data)) {
          this.cache.set(Number(key), data[key]);
        }
      }
    } catch (e) {
      console.warn('Failed to load achievements cache', e);
    }
  }

  private saveCache() {
    try {
      const dir = path.dirname(this.cachePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data: Record<string, any> = {};
      for (const [key, val] of this.cache.entries()) {
        data[key] = val;
      }
      fs.writeFileSync(this.cachePath, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save achievements cache', e);
    }
  }

  public async getAchievements(steamAppId: number): Promise<{ total: number; unlocked: number; items: AchievementItem[] }> {
    const cached = this.cache.get(steamAppId);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 30) {
      return { total: cached.total, unlocked: cached.unlocked, items: cached.items };
    }

    try {
      const xml = await this.fetchUrl(`https://steamcommunity.com/stats/${steamAppId}/achievements/?xml=1`);

      const items: AchievementItem[] = [];
      const achievementRegex = /<achievement closed="(\d+)">[\s\S]*?<name><!\[CDATA\[(.*?)\]\]><\/name>[\s\S]*?<description><!\[CDATA\[(.*?)\]\]><\/description>[\s\S]*?<iconClosed><!\[CDATA\[(.*?)\]\]><\/iconClosed>[\s\S]*?<unlockTimestamp>(\d*)<\/unlockTimestamp>[\s\S]*?<\/achievement>/g;

      let match;
      while ((match = achievementRegex.exec(xml)) !== null) {
        const isClosed = match[1] === '1';
        const name = match[2];
        const description = match[3];
        const icon = match[4];
        const unlockTime = match[5] ? Number(match[5]) * 1000 : undefined;

        items.push({
          id: `ach_${steamAppId}_${items.length}`,
          name,
          description,
          icon,
          unlocked: isClosed,
          unlockTime
        });
      }

      const unlocked = items.filter(a => a.unlocked).length;
      const total = items.length;

      const result = { total, unlocked, items, timestamp: Date.now() };
      this.cache.set(steamAppId, result);
      this.saveCache();
      return { total, unlocked, items };
    } catch {
      if (cached) {
        return { total: cached.total, unlocked: cached.unlocked, items: cached.items };
      }
      return {
        total: 0,
        unlocked: 0,
        items: []
      };
    }
  }

  private fetchUrl(urlStr: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = urlStr.startsWith('https') ? https : http;
      const req = client.get(urlStr, { headers: { 'User-Agent': 'Storm-Launcher/1.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(6000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

export const achievementEngine = new AchievementEngine();
