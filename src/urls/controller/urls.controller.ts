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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiSecurity } from '@nestjs/swagger';
import type { Response } from 'express';
import { UrlsService } from '../service/urls.service';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../entities/users/users.entity';

@ApiTags('URL')
@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) { }

  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Criar URL encurtada',
    description: 'Cria uma URL encurtada. Pode ser usado COM ou SEM autenticação. Se autenticado, permite criar alias customizado. Se não autenticado, gera slug automático.'
  })
  @ApiBody({ type: CreateUrlDto })
  @ApiResponse({
    status: 201,
    description: 'URL encurtada criada com sucesso',
    schema: {
      example: {
        id: 'uuid-da-url',
        originalUrl: 'https://www.exemplo.com.br/pagina-muito-longa',
        shortUrl: 'http://localhost:3000/abc123',
        slug: 'abc123',
        accessCount: 0,
        createdAt: '2026-02-03T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou alias customizado já em uso',
    schema: {
      example: {
        statusCode: 400,
        message: ['Alias customizado já está em uso'],
        error: 'Bad Request'
      }
    }
  })
  async createShortUrl(@Body() createUrlDto: CreateUrlDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.urlsService.createShortUrl(createUrlDto, userId);
  }

  @Get('my-urls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar minhas URLs',
    description: 'Retorna todas as URLs encurtadas do usuário autenticado'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de URLs retornada com sucesso',
    schema: {
      example: [{
        id: 'uuid-da-url',
        originalUrl: 'https://www.exemplo.com.br/pagina-muito-longa',
        shortUrl: 'http://localhost:3000/abc123',
        slug: 'abc123',
        accessCount: 15,
        isCustomAlias: false,
        createdAt: '2026-02-03T10:00:00.000Z',
        updatedAt: '2026-02-03T10:00:00.000Z'
      }]
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou não fornecido',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getMyUrls(@GetUser() user: User) {
    return this.urlsService.findMyUrls(user.id);
  }

  @Put('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Atualizar URL',
    description: 'Atualiza a URL original de uma URL encurtada. Apenas o dono da URL pode atualizá-la.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da URL a ser atualizada',
    example: 'uuid-da-url'
  })
  @ApiBody({ type: UpdateUrlDto })
  @ApiResponse({
    status: 200,
    description: 'URL atualizada com sucesso',
    schema: {
      example: {
        id: 'uuid-da-url',
        originalUrl: 'https://www.exemplo.com.br/nova-pagina',
        shortUrl: 'http://localhost:3000/abc123',
        slug: 'abc123',
        accessCount: 15,
        updatedAt: '2026-02-03T11:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou não fornecido'
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para atualizar esta URL',
    schema: {
      example: {
        statusCode: 403,
        message: 'Você não tem permissão para atualizar esta URL',
        error: 'Forbidden'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'URL não encontrada',
        error: 'Not Found'
      }
    }
  })
  async updateUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @GetUser() user: User,
  ) {
    return this.urlsService.updateUrl(id, updateUrlDto, user.id);
  }

  @Delete('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deletar URL',
    description: 'Remove uma URL encurtada (soft delete). Apenas o dono da URL pode deletá-la.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da URL a ser deletada',
    example: 'uuid-da-url'
  })
  @ApiResponse({
    status: 204,
    description: 'URL deletada com sucesso'
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou não fornecido'
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não tem permissão para deletar esta URL'
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada'
  })
  async deleteUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.urlsService.deleteUrl(id, user.id);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Redirecionar para URL original',
    description: '⚠️ Este endpoint deve ser acessado diretamente no navegador (http://localhost:3000/abc123), não através do Swagger UI. Redireciona para a URL original e incrementa o contador de acessos.'
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug da URL encurtada',
    example: 'abc123'
  })
  @ApiResponse({
    status: 302,
    description: 'Redirecionamento realizado com sucesso (não funciona no Swagger devido à natureza do redirect 302)'
  })
  @ApiResponse({
    status: 404,
    description: 'URL não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'URL não encontrada',
        error: 'Not Found'
      }
    }
  })
  async redirectToUrl(@Param('slug') slug: string, @Res() res: Response) {
    const originalUrl = await this.urlsService.redirectToOriginalUrl(slug);
    return res.redirect(302, originalUrl);
  }
}
