import {
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'URL original não pode estar vazia' })
  @IsUrl(
    {
      require_protocol: true,
      require_valid_protocol: true,
      protocols: ['http', 'https'],
    },
    { message: 'URL deve ser válida e começar com http:// ou https://' },
  )
  @MaxLength(2048, { message: 'URL não pode ter mais de 2048 caracteres' })
  url: string;

  @IsOptional()
  @IsString({ message: 'Alias customizado deve ser uma string' })
  @MinLength(3, {
    message: 'Alias customizado deve ter entre 3 e 30 caracteres',
  })
  @MaxLength(30, {
    message: 'Alias customizado deve ter entre 3 e 30 caracteres',
  })
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'Alias customizado deve conter apenas letras minúsculas, números, hífens e underscores',
  })
  customAlias?: string;
}
