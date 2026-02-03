import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UrlsModule } from './urls/urls.module';
import { OptionalJwtMiddleware } from './auth/middleware/optional-jwt.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    UrlsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OptionalJwtMiddleware)
      .forRoutes('shorten');
  }
}
