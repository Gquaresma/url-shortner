import { SlugGenerator } from './slug-generator.helper';

describe('SlugGenerator', () => {
  let slugGenerator: SlugGenerator;

  beforeEach(() => {
    slugGenerator = new SlugGenerator();
  });

  afterEach(() => {
    slugGenerator.destroy();
  });

  describe('cache operations', () => {
    it('should add slug to cache', () => {
      const slug = 'test123';

      slugGenerator.addToCache(slug);

      expect(slugGenerator.isInCache(slug)).toBe(true);
    });

    it('should check if slug is in cache', () => {
      const slug = 'test456';

      expect(slugGenerator.isInCache(slug)).toBe(false);

      slugGenerator.addToCache(slug);

      expect(slugGenerator.isInCache(slug)).toBe(true);
    });

    it('should keep multiple slugs in cache', () => {
      const slugs = ['slug1', 'slug2', 'slug3'];

      slugs.forEach(slug => slugGenerator.addToCache(slug));

      slugs.forEach(slug => {
        expect(slugGenerator.isInCache(slug)).toBe(true);
      });
    });
  });

  describe('generateOptimizedSlug', () => {
    it('should generate a slug with 6 characters', () => {
      const slug = slugGenerator.generateOptimizedSlug();

      expect(slug).toBeDefined();
      expect(slug.length).toBe(6);
    });

    it('should generate slug containing only valid characters', () => {
      const slug = slugGenerator.generateOptimizedSlug();
      const validChars = /^[A-Za-z0-9]+$/;

      expect(validChars.test(slug)).toBe(true);
    });

    it('should generate different slugs in consecutive calls', () => {
      const slug1 = slugGenerator.generateOptimizedSlug();
      const slug2 = slugGenerator.generateOptimizedSlug();

      expect(slug1).not.toBe(slug2);
    });
  });

  describe('generateRandomSlug', () => {
    it('should generate a slug with 6 characters', () => {
      const slug = slugGenerator.generateRandomSlug();

      expect(slug).toBeDefined();
      expect(slug.length).toBe(6);
    });

    it('should generate slug containing only valid characters', () => {
      const slug = slugGenerator.generateRandomSlug();
      const validChars = /^[A-Za-z0-9]+$/;

      expect(validChars.test(slug)).toBe(true);
    });

    it('should generate different slugs in consecutive calls', () => {
      const slug1 = slugGenerator.generateRandomSlug();
      const slug2 = slugGenerator.generateRandomSlug();

      expect(slug1).not.toBe(slug2);
    });
  });

  describe('destroy', () => {
    it('should clear cache timer without errors', () => {
      expect(() => slugGenerator.destroy()).not.toThrow();
    });

    it('should allow destroying multiple times', () => {
      slugGenerator.destroy();
      expect(() => slugGenerator.destroy()).not.toThrow();
    });
  });
});
