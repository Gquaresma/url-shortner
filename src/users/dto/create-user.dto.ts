import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Email não pode estar vazio' })
  @IsEmail({}, { message: 'Email deve ser válido' })
  @MaxLength(255, { message: 'Email não pode ter mais de 255 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres, deve conter letra maiúscula, minúscula, número e caractere especial)',
    example: 'Senha@123',
    minLength: 8,
    maxLength: 128,
  })
  @IsNotEmpty({ message: 'Senha não pode estar vazia' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'Senha não pode ter mais de 128 caracteres' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial',
    },
  )
  password: string;
}
