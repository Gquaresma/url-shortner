import { Test, TestingModule } from '@nestjs/testing';
import { UrlsController } from './urls.controller';
import { UrlsService } from '../service/urls.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';

describe('UrlsController', () => {
  let controller: UrlsController;
  let service: UrlsService;

  const mockUrlsService = {
    createShortUrl: jest.fn(),
    findMyUrls: jest.fn(),
    updateUrl: jest.fn(),
    deleteUrl: jest.fn(),
    redirectToOriginalUrl: jest.fn(),
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    urls: [],
  };

  const mockShortUrl = {
    id: 'mock-uuid-1',
    originalUrl: 'https://www.example.com',
    shortUrl: 'http://localhost:3000/abc123',
    slug: 'abc123',
    accessCount: 0,
    createdAt: new Date('2026-02-03T10:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlsController],
      providers: [
        {
          provide: UrlsService,
          useValue: mockUrlsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UrlsController>(UrlsController);
    service = module.get<UrlsService>(UrlsService);

    jest.clearAllMocks();
  });

  describe('createShortUrl', () => {
    it('deve criar uma URL encurtada sem autenticação', async () => {
      const createUrlDto: CreateUrlDto = { url: 'https://www.example.com' };
      const req = {};

      mockUrlsService.createShortUrl.mockResolvedValue(mockShortUrl);

      const result = await controller.createShortUrl(createUrlDto, req);

      expect(result).toEqual(mockShortUrl);
      expect(service.createShortUrl).toHaveBeenCalledWith(createUrlDto, undefined);
    });

    it('deve criar uma URL encurtada com autenticação', async () => {
      const createUrlDto: CreateUrlDto = { url: 'https://www.example.com' };
      const req = { user: mockUser };

      mockUrlsService.createShortUrl.mockResolvedValue(mockShortUrl);

      const result = await controller.createShortUrl(createUrlDto, req);

      expect(result).toEqual(mockShortUrl);
      expect(service.createShortUrl).toHaveBeenCalledWith(createUrlDto, mockUser.id);
    });

    it('deve criar uma URL com alias customizado', async () => {
      const createUrlDto: CreateUrlDto = {
        url: 'https://www.example.com',
        customAlias: 'myalias'
      };
      const req = { user: mockUser };
      const customShortUrl = { ...mockShortUrl, slug: 'myalias' };

      mockUrlsService.createShortUrl.mockResolvedValue(customShortUrl);

      const result = await controller.createShortUrl(createUrlDto, req);

      expect(result.slug).toBe('myalias');
      expect(service.createShortUrl).toHaveBeenCalledWith(createUrlDto, mockUser.id);
    });
  });

  describe('getMyUrls', () => {
    it('deve retornar todas as URLs do usuário', async () => {
      const mockUrls = [
        mockShortUrl,
        { ...mockShortUrl, id: 'mock-uuid-2', slug: 'xyz789' },
      ];

      mockUrlsService.findMyUrls.mockResolvedValue(mockUrls);

      const result = await controller.getMyUrls(mockUser);

      expect(result).toEqual(mockUrls);
      expect(service.findMyUrls).toHaveBeenCalledWith(mockUser.id);
    });

    it('deve retornar array vazio quando usuário não tiver URLs', async () => {
      mockUrlsService.findMyUrls.mockResolvedValue([]);

      const result = await controller.getMyUrls(mockUser);

      expect(result).toEqual([]);
      expect(service.findMyUrls).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateUrl', () => {
    it('deve atualizar uma URL com sucesso', async () => {
      const urlId = 'mock-uuid-1';
      const updateUrlDto: UpdateUrlDto = { url: 'https://www.new-example.com' };
      const updatedUrl = { ...mockShortUrl, originalUrl: updateUrlDto.url };

      mockUrlsService.updateUrl.mockResolvedValue(updatedUrl);

      const result = await controller.updateUrl(urlId, updateUrlDto, mockUser);

      expect(result).toEqual(updatedUrl);
      expect(service.updateUrl).toHaveBeenCalledWith(urlId, updateUrlDto, mockUser.id);
    });
  });

  describe('deleteUrl', () => {
    it('deve deletar uma URL com sucesso', async () => {
      const urlId = 'mock-uuid-1';

      mockUrlsService.deleteUrl.mockResolvedValue(undefined);

      const result = await controller.deleteUrl(urlId, mockUser);

      expect(result).toBeUndefined();
      expect(service.deleteUrl).toHaveBeenCalledWith(urlId, mockUser.id);
    });
  });
});
