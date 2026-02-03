import { ApiProperty } from '@nestjs/swagger';

export class UrlResponseDto {
  @ApiProperty({
    description: 'ID único da URL',
    example: 'uuid-da-url'
  })
  id: string;

  @ApiProperty({
    description: 'URL original',
    example: 'https://www.exemplo.com.br/pagina-muito-longa'
  })
  originalUrl: string;

  @ApiProperty({
    description: 'URL encurtada completa',
    example: 'http://localhost:3000/abc123'
  })
  shortUrl: string;

  @ApiProperty({
    description: 'Slug da URL encurtada',
    example: 'abc123'
  })
  slug: string;

  @ApiProperty({
    description: 'Número de acessos à URL',
    example: 0
  })
  accessCount: number;

  @ApiProperty({
    description: 'Indica se o slug é um alias customizado',
    example: false,
    required: false
  })
  isCustomAlias?: boolean;

  @ApiProperty({
    description: 'Data de criação',
    example: '2026-02-03T10:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2026-02-03T10:00:00.000Z',
    required: false
  })
  updatedAt?: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        example: 'uuid-do-usuario'
      },
      email: {
        type: 'string',
        example: 'usuario@exemplo.com'
      }
    }
  })
  user: {
    id: string;
    email: string;
  };
}

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 'uuid-do-usuario'
  })
  id: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com'
  })
  email: string;

  @ApiProperty({
    description: 'Data de criação da conta',
    example: '2026-02-03T10:00:00.000Z'
  })
  createdAt: Date;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro ou array de mensagens de validação',
    oneOf: [
      { type: 'string', example: 'URL não encontrada' },
      { type: 'array', items: { type: 'string' }, example: ['Email já está em uso'] }
    ]
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Bad Request'
  })
  error: string;
}
