import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { UrlsService } from '../service/urls.service';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../entities/users/users.entity';

@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) { }

  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  async createShortUrl(@Body() createUrlDto: CreateUrlDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.urlsService.createShortUrl(createUrlDto, userId);
  }

  @Get('my-urls')
  @UseGuards(JwtAuthGuard)
  async getMyUrls(@GetUser() user: User) {
    return this.urlsService.findMyUrls(user.id);
  }

  @Put('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  async updateUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @GetUser() user: User,
  ) {
    return this.urlsService.updateUrl(id, updateUrlDto, user.id);
  }

  @Delete('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.urlsService.deleteUrl(id, user.id);
  }

  @Get(':slug')
  async redirectToUrl(@Param('slug') slug: string, @Res() res: Response) {
    const originalUrl = await this.urlsService.redirectToOriginalUrl(slug);
    return res.redirect(302, originalUrl);
  }
}
