import { SlugGenerator } from './slug-generator.helper';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Url } from '../entity/urls.entity';

describe('SlugGenerator', () => {
  let slugGenerator: SlugGenerator;
  let mockRepository: Partial<Repository<Url>>;

  beforeEach(() => {
    slugGenerator = new SlugGenerator();
    mockRepository = {
      findOne: jest.fn(),
    };
  });

  afterEach(() => {
    slugGenerator.destroy();
  });

  describe('isReservedSlug', () => {
    it('should return true for reserved slugs', () => {
      expect(slugGenerator.isReservedSlug('api')).toBe(true);
      expect(slugGenerator.isReservedSlug('auth')).toBe(true);
      expect(slugGenerator.isReservedSlug('docs')).toBe(true);
      expect(slugGenerator.isReservedSlug('shorten')).toBe(true);
      expect(slugGenerator.isReservedSlug('my-urls')).toBe(true);
    });

    it('should return true for reserved slugs in uppercase', () => {
      expect(slugGenerator.isReservedSlug('API')).toBe(true);
      expect(slugGenerator.isReservedSlug('AUTH')).toBe(true);
      expect(slugGenerator.isReservedSlug('DOCS')).toBe(true);
    });

    it('should return false for non-reserved slugs', () => {
      expect(slugGenerator.isReservedSlug('myslug')).toBe(false);
      expect(slugGenerator.isReservedSlug('abc123')).toBe(false);
      expect(slugGenerator.isReservedSlug('custom')).toBe(false);
    });
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

  describe('validateCustomAlias', () => {
    it('should throw ConflictException for reserved slug', async () => {
      await expect(
        slugGenerator.validateCustomAlias('api', mockRepository as Repository<Url>),
      ).rejects.toThrow(ConflictException);

      await expect(
        slugGenerator.validateCustomAlias('auth', mockRepository as Repository<Url>),
      ).rejects.toThrow('Este alias é uma rota reservada');
    });

    it('should throw ConflictException when alias already exists in database', async () => {
      const existingUrl = {
        id: 'uuid-1',
        slug: 'myalias',
        originalUrl: 'https://example.com',
        deletedAt: null,
      };

      (mockRepository.findOne as jest.Mock).mockResolvedValue(existingUrl);

      await expect(
        slugGenerator.validateCustomAlias('myalias', mockRepository as Repository<Url>),
      ).rejects.toThrow(ConflictException);

      await expect(
        slugGenerator.validateCustomAlias('myalias', mockRepository as Repository<Url>),
      ).rejects.toThrow('Este alias já está em uso');
    });

    it('should pass validation for valid and available alias', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        slugGenerator.validateCustomAlias('validalias', mockRepository as Repository<Url>),
      ).resolves.not.toThrow();

      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('should convert alias to lowercase before validating', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await slugGenerator.validateCustomAlias('MyAlias', mockRepository as Repository<Url>);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'myalias', deletedAt: expect.anything() },
      });
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate a unique slug with 6 characters', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const slug = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);

      expect(slug).toBeDefined();
      expect(slug.length).toBe(6);
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('should generate slug containing only valid characters', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const slug = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);
      const validChars = /^[A-Za-z0-9]+$/;

      expect(validChars.test(slug)).toBe(true);
    });

    it('should generate new slug when first one already exists', async () => {
      (mockRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'uuid-1', slug: 'abc123' }) 
        .mockResolvedValueOnce(null);

      const slug = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);

      expect(slug).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error when there is an extremely rare collision', async () => {
      (mockRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'uuid-1' }) 
        .mockResolvedValueOnce({ id: 'uuid-2' }); 

      await expect(
        slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>),
      ).rejects.toThrow('Colisão extremamente rara detectada');
    });

    it('should generate different slugs in consecutive calls', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const slug1 = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);
      const slug2 = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);

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
