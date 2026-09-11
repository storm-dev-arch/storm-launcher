import { protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

export function registerPlayProtocol(cacheDir: string) {
  protocol.handle('play', async (request) => {
    const url = new URL(request.url);
    const host = url.hostname;
    const pathname = decodeURIComponent(url.pathname);

    try {
      if (host === 'artwork') {
        const parts = pathname.replace(/^\//, '').split('/');
        const gameId = parts[0];
        const type = parts[1] || 'cover';

        const cachedFile = path.join(cacheDir, `${gameId}_${type}.jpg`);
        const cachedPng = path.join(cacheDir, `${gameId}_${type}.png`);

        if (fs.existsSync(cachedFile)) {
          return net.fetch(pathToFileURL(cachedFile).toString());
        } else if (fs.existsSync(cachedPng)) {
          return net.fetch(pathToFileURL(cachedPng).toString());
        }
      } else if (host === 'local') {
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
