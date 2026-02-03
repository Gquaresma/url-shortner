import { validate } from 'class-validator';
import { UpdateUrlDto } from './update-url.dto';
import { plainToClass } from 'class-transformer';

describe('UpdateUrlDto', () => {
  describe('Validação de URL', () => {
    it('deve passar com URL válida', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve falhar com URL sem protocolo', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('deve falhar com URL inválida', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'not-a-url',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('deve falhar com URL vazia', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: '',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('deve falhar com URL muito longa (> 2048 caracteres)', async () => {
      const longUrl = 'https://www.example.com/' + 'a'.repeat(2050);
      const dto = plainToClass(UpdateUrlDto, {
        url: longUrl,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('deve aceitar URLs com http', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'http://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve aceitar URLs com https', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve aceitar URLs com path complexo', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com/path/to/page?query=value&another=param#section',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve aceitar URLs com subdomínios', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://subdomain.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('deve aceitar URLs com portas', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com:8080',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });
});
