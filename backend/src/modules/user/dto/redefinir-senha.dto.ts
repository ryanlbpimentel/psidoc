import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class RedefinirSenhaDto {
  @ApiProperty({
    description: 'Token de recuperação recebido por e-mail',
    example: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty({ message: 'O token é obrigatório.' })
  token: string

  @ApiProperty({
    description: 'Nova senha de acesso (mínimo de 8 caracteres)',
    example: 'NovaSenha@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres.' })
  novaSenha: string
}
