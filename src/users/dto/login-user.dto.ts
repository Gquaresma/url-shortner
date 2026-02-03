import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({ message: 'Email não pode estar vazio' })
  @IsEmail({}, { message: 'Email deve ser válido' })
  email: string;

  @IsNotEmpty({ message: 'Senha não pode estar vazia' })
  @IsString({ message: 'Senha deve ser uma string' })
  password: string;
}
