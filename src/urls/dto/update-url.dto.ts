import { IsUrl, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUrlDto {
  @ApiProperty({
    description: 'Nova URL original (deve começar com http:// ou https://)',
    example: 'https://www.exemplo.com.br/nova-pagina',
    maxLength: 2048,
  })
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
