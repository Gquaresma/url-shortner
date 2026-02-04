export class SlugGenerator {
  private readonly SLUG_LENGTH = 6;
  private readonly SLUG_CHARS =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  private readonly recentSlugsCache = new Set<string>();
  private readonly CACHE_MAX_SIZE = 10000;
  private readonly CACHE_TTL = 60000;
  private cacheCleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cacheCleanupTimer = setInterval(() => {
      if (this.recentSlugsCache.size > this.CACHE_MAX_SIZE) {
        this.recentSlugsCache.clear();
      }
    }, this.CACHE_TTL);
  }

  destroy() {
    clearInterval(this.cacheCleanupTimer);
  }

  addToCache(slug: string): void {
    this.recentSlugsCache.add(slug);
  }

  isInCache(slug: string): boolean {
    return this.recentSlugsCache.has(slug);
  }

  generateOptimizedSlug(): string {
    const timestamp = Date.now();
    const random = Math.random();

    const seed = `${timestamp}${random}`;
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash = hash & hash;
    }

    let slug = '';
    let num = Math.abs(hash);

    for (let i = 0; i < this.SLUG_LENGTH; i++) {
      slug += this.SLUG_CHARS[num % this.SLUG_CHARS.length];
      num = Math.floor(num / this.SLUG_CHARS.length);

      if (num === 0) {
        num = Math.floor(Math.random() * this.SLUG_CHARS.length ** 3);
      }
    }

    return slug;
  }

  generateRandomSlug(): string {
    let slug = '';
    for (let i = 0; i < this.SLUG_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * this.SLUG_CHARS.length);
      slug += this.SLUG_CHARS[randomIndex];
    }
    return slug;
  }
}
