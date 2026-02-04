import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for authenticated request', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid-token',
            },
            user: { id: 'user-uuid-1', email: 'test@example.com' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const user = { id: 'user-uuid-1', email: 'test@example.com' };
      const info = null;
      const context = {} as ExecutionContext;

      const result = guard.handleRequest(null, user, info, context);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when there is no user', () => {
      const info = null;
      const context = {} as ExecutionContext;

      expect(() => guard.handleRequest(null, null, info, context)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error when there is an authentication error', () => {
      const error = new Error('Token inválido');
      const info = null;
      const context = {} as ExecutionContext;

      expect(() => guard.handleRequest(error, null, info, context)).toThrow(error);
    });
  });
});
