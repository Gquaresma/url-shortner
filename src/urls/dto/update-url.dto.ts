import { IsUrl, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateUrlDto {
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
}
