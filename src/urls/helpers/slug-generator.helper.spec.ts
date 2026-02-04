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
    it('deve retornar true para slugs reservados', () => {
      expect(slugGenerator.isReservedSlug('api')).toBe(true);
      expect(slugGenerator.isReservedSlug('auth')).toBe(true);
      expect(slugGenerator.isReservedSlug('docs')).toBe(true);
      expect(slugGenerator.isReservedSlug('shorten')).toBe(true);
      expect(slugGenerator.isReservedSlug('my-urls')).toBe(true);
    });

    it('deve retornar true para slugs reservados em maiúsculas', () => {
      expect(slugGenerator.isReservedSlug('API')).toBe(true);
      expect(slugGenerator.isReservedSlug('AUTH')).toBe(true);
      expect(slugGenerator.isReservedSlug('DOCS')).toBe(true);
    });

    it('deve retornar false para slugs não reservados', () => {
      expect(slugGenerator.isReservedSlug('myslug')).toBe(false);
      expect(slugGenerator.isReservedSlug('abc123')).toBe(false);
      expect(slugGenerator.isReservedSlug('custom')).toBe(false);
    });
  });

  describe('cache operations', () => {
    it('deve adicionar slug ao cache', () => {
      const slug = 'test123';

      slugGenerator.addToCache(slug);

      expect(slugGenerator.isInCache(slug)).toBe(true);
    });

    it('deve verificar se slug está no cache', () => {
      const slug = 'test456';

      expect(slugGenerator.isInCache(slug)).toBe(false);

      slugGenerator.addToCache(slug);

      expect(slugGenerator.isInCache(slug)).toBe(true);
    });

    it('deve manter múltiplos slugs no cache', () => {
      const slugs = ['slug1', 'slug2', 'slug3'];

      slugs.forEach(slug => slugGenerator.addToCache(slug));

      slugs.forEach(slug => {
        expect(slugGenerator.isInCache(slug)).toBe(true);
      });
    });
  });

  describe('validateCustomAlias', () => {
    it('deve lançar ConflictException para slug reservado', async () => {
      await expect(
        slugGenerator.validateCustomAlias('api', mockRepository as Repository<Url>),
      ).rejects.toThrow(ConflictException);

      await expect(
        slugGenerator.validateCustomAlias('auth', mockRepository as Repository<Url>),
      ).rejects.toThrow('Este alias é uma rota reservada');
    });

    it('deve lançar ConflictException quando alias já existir no banco', async () => {
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

    it('deve passar validação para alias válido e disponível', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        slugGenerator.validateCustomAlias('validalias', mockRepository as Repository<Url>),
      ).resolves.not.toThrow();

      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('deve converter alias para lowercase antes de validar', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      await slugGenerator.validateCustomAlias('MyAlias', mockRepository as Repository<Url>);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'myalias', deletedAt: expect.anything() },
      });
    });
  });

  describe('generateUniqueSlug', () => {
    it('deve gerar um slug único de 6 caracteres', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const slug = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);

      expect(slug).toBeDefined();
      expect(slug.length).toBe(6);
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('deve gerar slug contendo apenas caracteres válidos', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const slug = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);
      const validChars = /^[A-Za-z0-9]+$/;

      expect(validChars.test(slug)).toBe(true);
    });

    it('deve gerar novo slug quando primeiro já existir', async () => {
      (mockRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'uuid-1', slug: 'abc123' }) // Primeira tentativa: existe
        .mockResolvedValueOnce(null); // Segunda tentativa: disponível

      const slug = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);

      expect(slug).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('deve lançar erro quando houver colisão extremamente rara', async () => {
      (mockRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'uuid-1' }) // Primeira tentativa: existe
        .mockResolvedValueOnce({ id: 'uuid-2' }); // Segunda tentativa: também existe

      await expect(
        slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>),
      ).rejects.toThrow('Colisão extremamente rara detectada');
    });

    it('deve gerar slugs diferentes em chamadas consecutivas', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const slug1 = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);
      const slug2 = await slugGenerator.generateUniqueSlug(mockRepository as Repository<Url>);

      // Nota: existe uma chance muito pequena de colisão, mas é extremamente improvável
      expect(slug1).not.toBe(slug2);
    });
  });

  describe('destroy', () => {
    it('deve limpar timer de cache sem erros', () => {
      expect(() => slugGenerator.destroy()).not.toThrow();
    });

    it('deve permitir destruir múltiplas vezes', () => {
      slugGenerator.destroy();
      expect(() => slugGenerator.destroy()).not.toThrow();
    });
  });
});
