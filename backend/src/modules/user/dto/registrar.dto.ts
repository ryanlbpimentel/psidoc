import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator'

export class RegistrarDto {
  @ApiProperty({
    description: 'Nome completo do psicólogo',
    example: 'Dra. Maria Silva',
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string

  @ApiProperty({
    description: 'Endereço de e-mail institucional ou profissional',
    example: 'maria.silva@exemplo.com',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string

  @ApiProperty({
    description: 'CPF (apenas os 11 dígitos numéricos)',
    example: '12345678901',
  })
  @IsString()
  @Length(11, 11, { message: 'O CPF deve ter exatamente 11 dígitos' })
  cpf: string

  @ApiProperty({
    description: 'Telefone de contato com DDD',
    example: '85999998888',
  })
  @IsString()
  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  telefone: string

  @ApiProperty({
    description: 'Senha de acesso (mínimo de 8 caracteres)',
    example: 'SenhaForte@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  senha: string

  @ApiProperty({
    description: 'Registro profissional CRP (exatamente 7 dígitos)',
    example: '1234567',
  })
  @IsString()
  @Length(7, 7, { message: 'O CRP deve ter exatamente 7 dígitos' })
  crp: string
}
