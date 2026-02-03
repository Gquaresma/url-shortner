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
    let slug: string;
    let isCustomAlias = false;

    if (createUrlDto.customAlias) {
      if (!userId) {
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
    } else {
      slug = await this.slugGenerator.generateUniqueSlug(this.urlRepository);
    }

    const url = this.urlRepository.create({
      originalUrl: createUrlDto.url,
      slug,
      isCustomAlias,
      userId: userId || null,
    });

    const savedUrl = await this.urlRepository.save(url);

    this.slugGenerator.addToCache(slug);

    return {
      id: savedUrl.id,
      originalUrl: savedUrl.originalUrl,
      shortUrl: `${this.baseUrl}/${savedUrl.slug}`,
      slug: savedUrl.slug,
      accessCount: savedUrl.accessCount,
      createdAt: savedUrl.createdAt,
    };
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
    const url = await this.urlRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });

    if (!url) {
      throw new NotFoundException('URL não encontrada');
    }

    url.accessCount += 1;
    await this.urlRepository.save(url);

    return url.originalUrl;
  }
}
