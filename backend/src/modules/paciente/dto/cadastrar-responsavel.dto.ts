import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Parentesco } from '@prisma/client'
import { AtualizarEnderecoDto } from './atualizar-endereco.dto'

export class CadastrarResponsavelDto {
    @ApiProperty({ description: 'Nome completo do responsável legal', example: 'Maria de Souza' })
    @IsString()
    @IsNotEmpty({ message: 'O nome do responsável é obrigatório' })
    nome: string

    @ApiProperty({ description: 'Data de nascimento (AAAA-MM-DD)', example: '1980-05-15' })
    @IsDateString({}, { message: 'Informe uma data de nascimento válida no formato AAAA-MM-DD' })
    data_nascimento: string

    @ApiProperty({ description: 'Telefone com DDD', example: '85988887777' })
    @IsString()
    @Matches(/^\d{10,11}$/, { message: 'O telefone deve conter DDD e 8 ou 9 dígitos' })
    telefone: string

    @ApiProperty({ description: 'CPF do responsável (11 dígitos numéricos)', example: '12345678901' })
    @IsString()
    @Matches(/^\d{11}$/, { message: 'O CPF do responsável deve conter 11 dígitos numéricos' })
    cpf: string

    @ApiProperty({ description: 'E-mail do responsável', example: 'responsavel@example.com' })
    @IsEmail({}, { message: 'Informe um e-mail válido para o responsável' })
    email: string

    @ApiProperty({ enum: Parentesco, description: 'Grau de parentesco com o paciente', example: Parentesco.MAE })
    @IsEnum(Parentesco, { message: 'Parentesco inválido' })
    parentesco: Parentesco

    @ApiPropertyOptional({ description: 'Endereço específico do responsável (caso resida em endereço diferente do paciente)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => AtualizarEnderecoDto)
    endereco?: AtualizarEnderecoDto
}