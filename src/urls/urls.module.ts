import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlsController } from './controller/urls.controller';
import { UrlsService } from './service/urls.service';
import { Url } from '../entities/urls/urls.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Url]), AuthModule],
  controllers: [UrlsController],
  providers: [UrlsService],
  exports: [UrlsService],
})
export class UrlsModule { }
