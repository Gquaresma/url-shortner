import { validate } from 'class-validator';
import { UpdateUrlDto } from './update-url.dto';
import { plainToClass } from 'class-transformer';

describe('UpdateUrlDto', () => {
  describe('URL Validation', () => {
    it('should pass with valid URL', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail with URL without protocol', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('should fail with invalid URL', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'not-a-url',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('should fail with empty URL', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: '',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with URL too long (> 2048 characters)', async () => {
      const longUrl = 'https://www.example.com/' + 'a'.repeat(2050);
      const dto = plainToClass(UpdateUrlDto, {
        url: longUrl,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('url');
    });

    it('should accept URLs with http', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'http://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept URLs with https', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept URLs with complex path', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com/path/to/page?query=value&another=param#section',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept URLs with subdomains', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://subdomain.example.com',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept URLs with ports', async () => {
      const dto = plainToClass(UpdateUrlDto, {
        url: 'https://www.example.com:8080',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });
});
