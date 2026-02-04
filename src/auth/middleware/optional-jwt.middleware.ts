import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class OptionalJwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = this.jwtService.verify(token, { secret });

        (req as any).user = { id: payload.sub, email: payload.email };
      } catch (error) {
        Sentry.logger.debug('Invalid or expired JWT token in optional middleware', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          method: req.method,
        });
      }
    }

    next();
  }
}
