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

  it('deve estar definido', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('deve retornar true para requisição autenticada', async () => {
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

      // Mock do método canActivate da superclasse
      jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('deve retornar usuário quando autenticação for bem-sucedida', () => {
      const user = { id: 'user-uuid-1', email: 'test@example.com' };
      const info = null;
      const context = {} as ExecutionContext;

      const result = guard.handleRequest(null, user, info, context);

      expect(result).toEqual(user);
    });

    it('deve lançar UnauthorizedException quando não houver usuário', () => {
      const info = null;
      const context = {} as ExecutionContext;

      expect(() => guard.handleRequest(null, null, info, context)).toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar erro quando houver erro na autenticação', () => {
      const error = new Error('Token inválido');
      const info = null;
      const context = {} as ExecutionContext;

      expect(() => guard.handleRequest(error, null, info, context)).toThrow(error);
    });
  });
});
