// Глобальный in-memory кеш — живёт всё время пока открыто приложение
const imageCache = new Map<string, string>();

export function useImageCache() {
  const preload = (src: string): Promise<string> => {
    if (!src) return Promise.reject(new Error('Empty src'));
    if (imageCache.has(src)) {
      return Promise.resolve(imageCache.get(src)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(src, src);
        resolve(src);
      };
      img.onerror = () => reject(new Error(`Failed: ${src}`));
      img.src = src;
    });
  };

  const set = (src: string) => {
    if (src) imageCache.set(src, src);
  };

  const get = (src: string): string | null => {
    return imageCache.get(src) || null;
  };

  const has = (src: string): boolean => {
    return !!src && imageCache.has(src);
  };

  return { preload, set, get, has };
}
