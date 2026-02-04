import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { SlugService } from './slug.service';
import { Url } from '../entity/urls.entity';

describe('SlugService', () => {
  let service: SlugService;
  let repository: Repository<Url>;

  const mockRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlugService,
        {
          provide: getRepositoryToken(Url),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SlugService>(SlugService);
    repository = module.get<Repository<Url>>(getRepositoryToken(Url));

    jest.clearAllMocks();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('isReservedSlug', () => {
    it('should return true for reserved slugs', () => {
      expect(service.isReservedSlug('api')).toBe(true);
      expect(service.isReservedSlug('auth')).toBe(true);
      expect(service.isReservedSlug('docs')).toBe(true);
      expect(service.isReservedSlug('shorten')).toBe(true);
      expect(service.isReservedSlug('my-urls')).toBe(true);
    });

    it('should return true for reserved slugs in uppercase', () => {
      expect(service.isReservedSlug('API')).toBe(true);
      expect(service.isReservedSlug('AUTH')).toBe(true);
      expect(service.isReservedSlug('DOCS')).toBe(true);
    });

    it('should return false for non-reserved slugs', () => {
      expect(service.isReservedSlug('myslug')).toBe(false);
      expect(service.isReservedSlug('abc123')).toBe(false);
      expect(service.isReservedSlug('custom')).toBe(false);
    });
  });

  describe('validateCustomAlias', () => {
    it('should throw ConflictException for reserved slug', async () => {
      await expect(service.validateCustomAlias('api')).rejects.toThrow(
        ConflictException,
      );

      await expect(service.validateCustomAlias('auth')).rejects.toThrow(
        'Este alias é uma rota reservada',
      );
    });

    it('should throw ConflictException when alias already exists in database', async () => {
      const existingUrl = {
        id: 'uuid-1',
        slug: 'myalias',
        originalUrl: 'https://example.com',
        deletedAt: null,
      };

      mockRepository.findOne.mockResolvedValue(existingUrl);

      await expect(service.validateCustomAlias('myalias')).rejects.toThrow(
        ConflictException,
      );

      await expect(service.validateCustomAlias('myalias')).rejects.toThrow(
        'Este alias já está em uso',
      );
    });

    it('should pass validation for valid and available alias', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateCustomAlias('validalias'),
      ).resolves.not.toThrow();

      expect(repository.findOne).toHaveBeenCalled();
    });

    it('should convert alias to lowercase before validating', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await service.validateCustomAlias('MyAlias');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: 'myalias', deletedAt: expect.anything() },
      });
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate a unique slug with 6 characters', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const slug = await service.generateUniqueSlug();

      expect(slug).toBeDefined();
      expect(slug.length).toBe(6);
      expect(repository.findOne).toHaveBeenCalled();
    });

    it('should generate slug containing only valid characters', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const slug = await service.generateUniqueSlug();
      const validChars = /^[A-Za-z0-9]+$/;

      expect(validChars.test(slug)).toBe(true);
    });

    it('should generate new slug when first one already exists', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1', slug: 'abc123' })
        .mockResolvedValueOnce(null);

      const slug = await service.generateUniqueSlug();

      expect(slug).toBeDefined();
      expect(repository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error when there is an extremely rare collision', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ id: 'uuid-1' })
        .mockResolvedValueOnce({ id: 'uuid-2' });

      await expect(service.generateUniqueSlug()).rejects.toThrow(
        'Colisão extremamente rara detectada',
      );
    });

    it('should generate different slugs in consecutive calls', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const slug1 = await service.generateUniqueSlug();
      const slug2 = await service.generateUniqueSlug();

      expect(slug1).not.toBe(slug2);
    });
  });
});
