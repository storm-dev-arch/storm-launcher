import { protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

export function registerPlayProtocol(cacheDir: string) {
  protocol.handle('play', async (request) => {
    // URL format: play://artwork/<gameId>/<type> or play://local/<encodedPath>
    const url = new URL(request.url);
    const host = url.hostname; // 'artwork' or 'local'
    const pathname = decodeURIComponent(url.pathname);

    try {
      if (host === 'artwork') {
        // e.g. play://artwork/730/cover or play://artwork/custom_123/cover
        const parts = pathname.replace(/^\//, '').split('/');
        const gameId = parts[0];
        const type = parts[1] || 'cover'; // cover, hero, logo

        const cachedFile = path.join(cacheDir, `${gameId}_${type}.jpg`);
        const cachedPng = path.join(cacheDir, `${gameId}_${type}.png`);

        if (fs.existsSync(cachedFile)) {
          return net.fetch(pathToFileURL(cachedFile).toString());
        } else if (fs.existsSync(cachedPng)) {
          return net.fetch(pathToFileURL(cachedPng).toString());
        }
      } else if (host === 'local') {
        // Direct local file stream
        const filePath = pathname.startsWith('/') && process.platform === 'win32'
          ? pathname.slice(1)
          : pathname;
        if (fs.existsSync(filePath)) {
          return net.fetch(pathToFileURL(filePath).toString());
        }
      }
    } catch (e) {
      console.error('Failed to handle play:// protocol request:', e);
    }

    return new Response('Not Found', { status: 404 });
  });
}
