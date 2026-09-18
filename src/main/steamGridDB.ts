import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import type { SteamGridArtItem, Game } from '../shared/types';
import { db } from './db';
import { artworkCache } from './steamgrid/artworkCache';

export class SteamGridDBService {
  public async searchArtwork(
    query: string,
    artType: 'cover' | 'hero' | 'logo' = 'cover'
  ): Promise<SteamGridArtItem[]> {
    const settings = db.getSettings();
    const apiKey = settings.steamGridApiKey;

    if (apiKey) {
      try {
        const gameId = await this.findSGDBGameId(query, apiKey);
        if (gameId) {
          const endpoint = artType === 'cover' ? 'grids' : artType === 'hero' ? 'heroes' : 'logos';
          const res = await this.getJson(`https://www.steamgriddb.com/api/v2/${endpoint}/game/${gameId}`, apiKey);
          if (res.success && Array.isArray(res.data)) {
            return res.data.map((item: any) => ({
              id: item.id,
              url: item.url,
              thumb: item.thumb,
              type: artType,
              width: item.width || (artType === 'cover' ? 600 : 1920),
              height: item.height || (artType === 'cover' ? 900 : 620),
              author: item.author?.name
            }));
          }
        }
      } catch (err) {
        // Silent fallback as requested
      }
    }

    return this.searchSteamPublicAssets(query, artType);
  }

  private async findSGDBGameId(query: string, apiKey: string): Promise<number | null> {
    const url = `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(query)}`;
    const data = await this.getJson(url, apiKey);
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].id;
    }
    return null;
  }

  private async searchSteamPublicAssets(query: string, artType: 'cover' | 'hero' | 'logo'): Promise<SteamGridArtItem[]> {
    const items: SteamGridArtItem[] = [];
    try {
      const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
      const searchRes = await this.getJson(searchUrl);

      if (searchRes && searchRes.items && Array.isArray(searchRes.items)) {
        for (const item of searchRes.items.slice(0, 6)) {
          const appId = item.id;
          if (artType === 'cover') {
            const url = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`;
            const thumb = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
            items.push({
              id: `steam_cover_${appId}`,
              url,
              thumb,
              type: 'cover',
              width: 600,
              height: 900,
              author: item.name
            });
          } else if (artType === 'hero') {
            const url = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_hero.jpg`;
            items.push({
              id: `steam_hero_${appId}`,
              url,
              thumb: url,
              type: 'hero',
              width: 1920,
              height: 620,
              author: item.name
            });
          } else {
            const url = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/logo.png`;
            items.push({
              id: `steam_logo_${appId}`,
              url,
              thumb: url,
              type: 'logo',
              width: 800,
              height: 350,
              author: item.name
            });
          }
        }
      }
    } catch {}

    return items;
  }

  public async applyArtwork(
    gameId: string,
    type: 'cover' | 'hero' | 'logo',
    imageUrl: string
  ): Promise<Game> {
    const game = db.getGame(gameId);
    if (!game) throw new Error('Game not found');

    const cached = artworkCache.getCachedArtwork(gameId, type);
    if (cached) {
      const updatedArtwork = { ...game.artwork };
      if (type === 'cover') updatedArtwork.cover = cached;
      if (type === 'hero') updatedArtwork.hero = cached;
      if (type === 'logo') updatedArtwork.logo = cached;
      return db.saveGame({ ...game, artwork: updatedArtwork });
    }

    const coversDir = path.join(db.getCacheDir(), 'covers');
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }

    const ext = imageUrl.includes('.png') ? '.png' : '.jpg';
    const localFileName = `${gameId}_${type}_${Date.now()}${ext}`;
    const localFilePath = path.join(coversDir, localFileName);

    await this.downloadFile(imageUrl, localFilePath);

    // Save to permanent cache directory
    const cachePath = artworkCache.getCachePath(gameId, type);
    try {
      fs.copyFileSync(localFilePath, cachePath);
    } catch {}

    const localUrl = `play://local/${localFilePath.replace(/\\/g, '/')}`;

    const updatedArtwork = { ...game.artwork };
    if (type === 'cover') updatedArtwork.cover = localUrl;
    if (type === 'hero') updatedArtwork.hero = localUrl;
    if (type === 'logo') updatedArtwork.logo = localUrl;

    const updated = db.saveGame({
      ...game,
      artwork: updatedArtwork
    });

    return updated;
  }

  private downloadFile(urlStr: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let isDone = false;
      const file = fs.createWriteStream(destPath);
      const client = urlStr.startsWith('https') ? https : http;

      const finishWithError = (err: Error) => {
        if (isDone) return;
        isDone = true;
        try { file.destroy(); } catch {}
        fs.unlink(destPath, () => {});
        reject(err);
      };

      const req = client.get(urlStr, {
        headers: {
          'User-Agent': 'Storm-Launcher/1.0'
        }
      }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            isDone = true;
            file.destroy();
            this.downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
            return;
          }
        }

        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          finishWithError(new Error(`HTTP Error ${response.statusCode || 0}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          if (isDone) return;
          isDone = true;
          file.close(() => resolve());
        });
        file.on('error', finishWithError);
      });

      req.setTimeout(6000, () => {
        req.destroy();
        finishWithError(new Error('Artwork download timed out (6s)'));
      });

      req.on('error', finishWithError);
    });
  }

  private getJson(urlStr: string, apiKey?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const client = urlStr.startsWith('https') ? https : http;
      const headers: Record<string, string> = {
        'User-Agent': 'Storm-Launcher/1.0'
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const req = client.get(urlStr, { headers }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

export const steamGridDBService = new SteamGridDBService();
