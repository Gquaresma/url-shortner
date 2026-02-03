import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Url } from '../../entities/urls/urls.entity';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';
import { SlugGenerator } from '../helpers/slug-generator.helper';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class UrlsService implements OnModuleDestroy {
  private readonly baseUrl: string;
  private readonly slugGenerator: SlugGenerator;

  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>('BASE_URL');
    if (!baseUrl) {
      throw new Error('BASE_URL Não está definido na configuração');
    }
    this.baseUrl = baseUrl;
    this.slugGenerator = new SlugGenerator();
  }

  onModuleDestroy() {
    this.slugGenerator.destroy();
  }

  async createShortUrl(
    createUrlDto: CreateUrlDto,
    userId?: string,
  ): Promise<any> {
    Sentry.logger.info('Creating short URL', {
      originalUrl: createUrlDto.url,
      customAlias: createUrlDto.customAlias,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
    });

    let slug: string;
    let isCustomAlias = false;

    try {
      if (createUrlDto.customAlias) {
        if (!userId) {
          Sentry.logger.warn('Custom alias without authentication', {
            customAlias: createUrlDto.customAlias,
            originalUrl: createUrlDto.url,
          });
          throw new BadRequestException(
            'Alias customizados requerem autenticação',
          );
        }

        await this.slugGenerator.validateCustomAlias(
          createUrlDto.customAlias,
          this.urlRepository,
        );

        slug = createUrlDto.customAlias.toLowerCase();
        isCustomAlias = true;
        Sentry.logger.info('Using custom alias', {
          slug,
          userId,
        });
      } else {
        slug = await this.slugGenerator.generateUniqueSlug(this.urlRepository);
        Sentry.logger.debug('Generated automatic slug', { slug });
      }

      const url = this.urlRepository.create({
        originalUrl: createUrlDto.url,
        slug,
        isCustomAlias,
        userId: userId || null,
      });

      const savedUrl = await this.urlRepository.save(url);

      this.slugGenerator.addToCache(slug);

      // Increment metrics
      Sentry.metrics.count('url_created', 1);
      if (isCustomAlias) {
        Sentry.metrics.count('url_custom_alias_created', 1);
      }

      Sentry.logger.info('Short URL created successfully', {
        urlId: savedUrl.id,
        slug: savedUrl.slug,
        isCustomAlias,
        userId: userId || 'anonymous',
      });

      return {
        id: savedUrl.id,
        originalUrl: savedUrl.originalUrl,
        shortUrl: `${this.baseUrl}/${savedUrl.slug}`,
        slug: savedUrl.slug,
        accessCount: savedUrl.accessCount,
        createdAt: savedUrl.createdAt,
      };
    } catch (error) {
      Sentry.logger.error('Failed to create short URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalUrl: createUrlDto.url,
        customAlias: createUrlDto.customAlias,
      });
      throw error;
    }
  }

  async findMyUrls(userId: string): Promise<any[]> {
    const urls = await this.urlRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return urls.map((url) => ({
      id: url.id,
      originalUrl: url.originalUrl,
      shortUrl: `${this.baseUrl}/${url.slug}`,
      slug: url.slug,
      accessCount: url.accessCount,
      isCustomAlias: url.isCustomAlias,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    }));
  }

  async updateUrl(
    id: string,
    updateUrlDto: UpdateUrlDto,
    userId: string,
  ): Promise<any> {
    const url = await this.urlRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    if (url.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para atualizar esta URL');
    }

    url.originalUrl = updateUrlDto.url;
    url.updatedAt = new Date();

    const updatedUrl = await this.urlRepository.save(url);

    return {
      id: updatedUrl.id,
      originalUrl: updatedUrl.originalUrl,
      shortUrl: `${this.baseUrl}/${updatedUrl.slug}`,
      slug: updatedUrl.slug,
      accessCount: updatedUrl.accessCount,
      updatedAt: updatedUrl.updatedAt,
    };
  }

  async deleteUrl(id: string, userId: string): Promise<void> {
    const url = await this.urlRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    if (url.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para deletar esta URL');
    }

    url.deletedAt = new Date();
    await this.urlRepository.save(url);
  }

  async redirectToOriginalUrl(slug: string): Promise<string> {
    Sentry.logger.debug('Redirecting URL', { slug });

    const startTime = Date.now();

    const url = await this.urlRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });

    if (!url) {
      Sentry.logger.warn('URL not found for redirect', { slug });
      throw new NotFoundException('URL não encontrada');
    }

    url.accessCount += 1;
    await this.urlRepository.save(url);

    const duration = Date.now() - startTime;
    Sentry.metrics.distribution('url_redirect_duration', duration);
    Sentry.metrics.count('url_redirected', 1);

    Sentry.logger.info('URL redirected successfully', {
      slug,
      originalUrl: url.originalUrl,
      accessCount: url.accessCount,
      duration,
    });

    return url.originalUrl;
  }
}
