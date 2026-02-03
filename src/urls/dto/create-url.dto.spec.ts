import { validate } from 'class-validator';
import { CreateUrlDto } from './create-url.dto';
import { plainToClass } from 'class-transformer';

describe('CreateUrlDto', () => {
  describe('Validação de URL', () => {
    it('deve passar com URL válida', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve falhar com URL sem protocolo', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('deve falhar com URL inválida', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'not-a-url',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('deve falhar com URL vazia', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: '',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('deve falhar com URL muito longa (> 2048 caracteres)', async () => {
      const longUrl = 'https://www.example.com/' + 'a'.repeat(2050);
      const dto = plainToClass(CreateUrlDto, {
        url: longUrl,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('deve aceitar URLs com http', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'http://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve aceitar URLs com https', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('Validação de customAlias', () => {
    it('deve ser opcional', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve passar com alias válido', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu-link',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve falhar com alias muito curto (< 3 caracteres)', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'ab',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('deve falhar com alias muito longo (> 30 caracteres)', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'a'.repeat(31),
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('deve falhar com alias contendo caracteres inválidos', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu link!',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('deve falhar com alias contendo letras maiúsculas', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'MeuLink',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('deve aceitar alias com hífens', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu-link-aqui',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve aceitar alias com underscores', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu_link_aqui',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve aceitar alias com números', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'link123',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });
});
