import { ApiProperty } from '@nestjs/swagger'
import { IsEmail } from 'class-validator'

export class EsqueciSenhaDto {
  @ApiProperty({
    description: 'E-mail do usuário para envio do link de recuperação',
    example: 'maria.silva@exemplo.com',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string
}