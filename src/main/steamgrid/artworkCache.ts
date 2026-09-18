import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export class ArtworkCacheManager {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(app.getPath('appData'), 'storm-launcher', 'artwork');
    this.ensureDir();
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not create artwork cache directory:', e);
    }
  }

  public getCachePath(gameId: string, type: 'cover' | 'hero' | 'logo'): string {
    const safeId = gameId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const gameDir = path.join(this.baseDir, safeId);
    if (!fs.existsSync(gameDir)) {
      fs.mkdirSync(gameDir, { recursive: true });
    }
    return path.join(gameDir, `${type}.jpg`);
  }

  public getCachedArtwork(gameId: string, type: 'cover' | 'hero' | 'logo'): string | null {
    try {
      const filePath = this.getCachePath(gameId, type);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 500) {
          return `play://local/${filePath.replace(/\\/g, '/')}`;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  public async cacheArtwork(
    gameId: string,
    type: 'cover' | 'hero' | 'logo',
    data: Buffer | string
  ): Promise<string> {
    const filePath = this.getCachePath(gameId, type);
    if (typeof data === 'string') {
      fs.writeFileSync(filePath, data, 'utf8');
    } else {
      fs.writeFileSync(filePath, data);
    }
    return `play://local/${filePath.replace(/\\/g, '/')}`;
  }
}

export const artworkCache = new ArtworkCacheManager();
