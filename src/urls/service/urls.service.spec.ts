import { Test, TestingModule } from '@nestjs/testing';
import { UrlsService } from './urls.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Url } from '../entity/urls.entity';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SlugService } from './slug.service';

describe('UrlsService', () => {
  let service: UrlsService;
  let repository: Repository<Url>;
  let configService: ConfigService;
  let slugService: SlugService;

  const mockUrl = {
    id: 'mock-uuid-1',
    originalUrl: 'https://www.example.com',
    slug: 'abc123',
    isCustomAlias: false,
    accessCount: 0,
    userId: 'user-uuid-1',
    createdAt: new Date('2026-02-03T10:00:00.000Z'),
    updatedAt: new Date('2026-02-03T10:00:00.000Z'),
    deletedAt: null,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  const mockSlugService = {
    validateCustomAlias: jest.fn(),
    generateUniqueSlug: jest.fn().mockResolvedValue('abc123'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        {
          provide: getRepositoryToken(Url),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SlugService,
          useValue: mockSlugService,
        },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
    repository = module.get<Repository<Url>>(getRepositoryToken(Url));
    configService = module.get<ConfigService>(ConfigService);
    slugService = module.get<SlugService>(SlugService);

    jest.clearAllMocks();
  });

  describe('createShortUrl', () => {
    it('should create a short URL with automatic slug for unauthenticated user', async () => {
      const createUrlDto = { url: 'https://www.example.com' };

      mockRepository.create.mockReturnValue(mockUrl);
      mockRepository.save.mockResolvedValue(mockUrl);

      const result = await service.createShortUrl(createUrlDto);

      expect(result).toEqual({
        id: mockUrl.id,
        originalUrl: mockUrl.originalUrl,
        shortUrl: `http://localhost:3000/${mockUrl.slug}`,
        slug: mockUrl.slug,
        accessCount: mockUrl.accessCount,
        createdAt: mockUrl.createdAt,
      });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: createUrlDto.url,
          isCustomAlias: false,
          userId: null,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create a short URL with automatic slug for authenticated user', async () => {
      const createUrlDto = { url: 'https://www.example.com' };
      const userId = 'user-uuid-1';

      mockRepository.create.mockReturnValue(mockUrl);
      mockRepository.save.mockResolvedValue(mockUrl);

      const result = await service.createShortUrl(createUrlDto, userId);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: createUrlDto.url,
          isCustomAlias: false,
          userId: userId,
        }),
      );
    });

    it('should create a URL with custom alias for authenticated user', async () => {
      const createUrlDto = {
        url: 'https://www.example.com',
        customAlias: 'myalias'
      };
      const userId = 'user-uuid-1';
      const customUrl = { ...mockUrl, slug: 'myalias', isCustomAlias: true };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(customUrl);
      mockRepository.save.mockResolvedValue(customUrl);

      const result = await service.createShortUrl(createUrlDto, userId);

      expect(result.slug).toBe('myalias');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'myalias',
          isCustomAlias: true,
        }),
      );
    });

    it('should throw BadRequestException when custom alias is used without authentication', async () => {
      const createUrlDto = {
        url: 'https://www.example.com',
        customAlias: 'myalias'
      };

      await expect(service.createShortUrl(createUrlDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when custom alias is already in use', async () => {
      const createUrlDto = {
        url: 'https://www.example.com',
        customAlias: 'myalias'
      };
      const userId = 'user-uuid-1';

      const ConflictException = require('@nestjs/common').ConflictException;
      mockSlugService.validateCustomAlias.mockRejectedValue(
        new ConflictException('Este alias já está em uso')
      );

      await expect(service.createShortUrl(createUrlDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findMyUrls', () => {
    it('should return all user URLs', async () => {
      const userId = 'user-uuid-1';
      const mockUrls = [mockUrl, { ...mockUrl, id: 'mock-uuid-2', slug: 'xyz789' }];

      mockRepository.find.mockResolvedValue(mockUrls);

      const result = await service.findMyUrls(userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockUrl.id,
        originalUrl: mockUrl.originalUrl,
        shortUrl: `http://localhost:3000/${mockUrl.slug}`,
        slug: mockUrl.slug,
        accessCount: mockUrl.accessCount,
        isCustomAlias: mockUrl.isCustomAlias,
        createdAt: mockUrl.createdAt,
        updatedAt: mockUrl.updatedAt,
      });
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId, deletedAt: expect.anything() },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when user has no URLs', async () => {
      const userId = 'user-uuid-1';

      mockRepository.find.mockResolvedValue([]);

      const result = await service.findMyUrls(userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateUrl', () => {
    it('should update URL successfully', async () => {
      const urlId = 'mock-uuid-1';
      const userId = 'user-uuid-1';
      const updateUrlDto = { url: 'https://www.new-example.com' };
      const updatedUrl = {
        ...mockUrl,
        originalUrl: updateUrlDto.url,
        updatedAt: new Date('2026-02-03T11:00:00.000Z')
      };

      mockRepository.findOne.mockResolvedValue(mockUrl);
      mockRepository.save.mockResolvedValue(updatedUrl);

      const result = await service.updateUrl(urlId, updateUrlDto, userId);

      expect(result.originalUrl).toBe(updateUrlDto.url);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when URL does not exist', async () => {
      const urlId = 'mock-uuid-1';
      const userId = 'user-uuid-1';
      const updateUrlDto = { url: 'https://www.new-example.com' };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUrl(urlId, updateUrlDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not the owner of the URL', async () => {
      const urlId = 'mock-uuid-1';
      const userId = 'different-user-uuid';
      const updateUrlDto = { url: 'https://www.new-example.com' };

      mockRepository.findOne.mockResolvedValue(mockUrl);

      await expect(service.updateUrl(urlId, updateUrlDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteUrl', () => {
    it('should soft delete URL successfully', async () => {
      const urlId = 'mock-uuid-1';
      const userId = 'user-uuid-1';

      mockRepository.findOne.mockResolvedValue(mockUrl);
      mockRepository.save.mockResolvedValue({ ...mockUrl, deletedAt: new Date() });

      await service.deleteUrl(urlId, userId);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when URL does not exist', async () => {
      const urlId = 'mock-uuid-1';
      const userId = 'user-uuid-1';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUrl(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not the owner of the URL', async () => {
      const urlId = 'mock-uuid-1';
      const userId = 'different-user-uuid';

      mockRepository.findOne.mockResolvedValue(mockUrl);

      await expect(service.deleteUrl(urlId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('redirectToOriginalUrl', () => {
    it('should return original URL and increment access counter', async () => {
      const slug = 'abc123';
      const urlWithIncrementedCount = { ...mockUrl, accessCount: 1 };

      mockRepository.findOne.mockResolvedValue(mockUrl);
      mockRepository.save.mockResolvedValue(urlWithIncrementedCount);

      const result = await service.redirectToOriginalUrl(slug);

      expect(result).toBe(mockUrl.originalUrl);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accessCount: 1,
        }),
      );
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      const slug = 'nonexistent';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.redirectToOriginalUrl(slug)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
