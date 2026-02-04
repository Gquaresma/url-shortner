import { validate } from 'class-validator';
import { CreateUrlDto } from './create-url.dto';
import { plainToClass } from 'class-transformer';

describe('CreateUrlDto', () => {
  describe('URL Validation', () => {
    it('should pass with valid URL', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail with URL without protocol', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('should fail with invalid URL', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'not-a-url',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('should fail with empty URL', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: '',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with URL too long (> 2048 characters)', async () => {
      const longUrl = 'https://www.example.com/' + 'a'.repeat(2050);
      const dto = plainToClass(CreateUrlDto, {
        url: longUrl,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('should accept URLs with http', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'http://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept URLs with https', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('customAlias Validation', () => {
    it('should be optional', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should pass with valid alias', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu-link',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail with alias too short (< 3 characters)', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'ab',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('should fail with alias too long (> 30 characters)', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'a'.repeat(31),
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('should fail with alias containing invalid characters', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu link!',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('should fail with alias containing uppercase letters', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'MeuLink',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('customAlias');
    });

    it('should accept alias with hyphens', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu-link-aqui',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept alias with underscores', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'meu_link_aqui',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept alias with numbers', async () => {
      const dto = plainToClass(CreateUrlDto, {
        url: 'https://www.example.com',
        customAlias: 'link123',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });
});
