import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  @IsNotEmpty({ message: 'Email não pode estar vazio' })
  @IsEmail({}, { message: 'Email deve ser válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'Senha@123',
  })
  @IsNotEmpty({ message: 'Senha não pode estar vazia' })
  @IsString({ message: 'Senha deve ser uma string' })
  password: string;
}
