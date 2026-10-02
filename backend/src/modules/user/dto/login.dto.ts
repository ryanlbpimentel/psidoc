import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    description: 'E-mail cadastrado',
    example: 'robofox600@gmail.com',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string

  @ApiProperty({
    description: 'Senha de acesso',
    example: 'SenhaForte@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  senha: string
}