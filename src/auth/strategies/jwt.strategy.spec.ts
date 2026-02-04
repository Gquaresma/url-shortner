import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-key'),
    getOrThrow: jest.fn().mockReturnValue('test-secret-key'),
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  describe('validate', () => {
    beforeEach(() => {
      mockAuthService.validateUser.mockClear();
    });

    it('should return user when payload is valid', async () => {
      const payload = { sub: 'user-uuid-1', email: 'test@example.com' };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await jwtStrategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(payload);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = { sub: 'nonexistent-uuid', email: 'test@example.com' };

      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('Usuário não encontrado'),
      );

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('constructor', () => {
    it('should use secret key from ConfigService', () => {
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
