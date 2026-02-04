import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Url } from '../entity/urls.entity';
import { SlugGenerator } from '../helpers/slug-generator.helper';

@Injectable()
export class SlugService {
  private readonly RESERVED_SLUGS = [
    'api',
    'auth',
    'docs',
    'shorten',
    'my-urls',
  ];

  private slugGenerator: SlugGenerator;

  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
  ) {
    this.slugGenerator = new SlugGenerator();
  }

  onModuleDestroy() {
    this.slugGenerator.destroy();
  }

  isReservedSlug(slug: string): boolean {
    return this.RESERVED_SLUGS.includes(slug.toLowerCase());
  }

  async validateCustomAlias(customAlias: string): Promise<void> {
    if (this.isReservedSlug(customAlias)) {
      throw new ConflictException('Este alias é uma rota reservada');
    }

    const existingAlias = await this.urlRepository.findOne({
      where: { slug: customAlias.toLowerCase(), deletedAt: IsNull() },
    });

    if (existingAlias) {
      throw new ConflictException('Este alias já está em uso');
    }
  }

  async generateUniqueSlug(): Promise<string> {
    let slug = this.slugGenerator.generateOptimizedSlug();

    const existing = await this.urlRepository.findOne({
      where: { slug },
      select: ['id'],
    });

    if (!existing) {
      return slug;
    }

    slug = this.slugGenerator.generateRandomSlug();
    const finalCheck = await this.urlRepository.findOne({
      where: { slug },
      select: ['id'],
    });

    if (!finalCheck) {
      return slug;
    }

    throw new Error(
      'Colisão extremamente rara detectada. Verifique o gerador de slugs.',
    );
  }
}
