import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'

export class RegistrarDto {
  @ApiProperty({
    description: 'Nome completo do psicólogo',
    example: 'Katia Cilene Bizerra Pimentel',
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  nome: string

  @ApiProperty({
    description: 'Endereço de e-mail institucional ou profissional',
    example: 'robofox600@gmail.com',
  })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string

  @ApiProperty({
    description: 'CPF (apenas os 11 dígitos numéricos)',
    example: '20143908782',
  })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter exatamente 11 dígitos numéricos' })
  cpf: string

  @ApiProperty({
    description: 'Telefone de contato com DDD',
    example: '21972672346',
  })
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone deve conter DDD e 8 ou 9 dígitos numéricos',
  })
  telefone: string

  @ApiProperty({
    description: 'Senha de acesso (mínimo de 8 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais)',
    example: 'SenhaForte@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'A senha deve conter ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&#)',
  })
  senha: string

  @ApiProperty({
    description: 'Registro profissional CRP (aceita com apenas 7 dígitos)',
    example: '1114185',
  })
  @IsString()
  @Matches(/^\d{7}$/, { message: 'O CRP deve conter exatamente 7 dígitos numéricos' })
  crp: string
}