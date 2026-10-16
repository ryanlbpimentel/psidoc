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


export class AtualizarResponsavelDto {
    @ApiPropertyOptional({ description: 'Nome completo do responsável legal', example: 'Maria de Souza' })
    @IsOptional()
    @IsString()
    nome?: string

    @ApiPropertyOptional({ description: 'Data de nascimento (AAAA-MM-DD)', example: '1980-05-15' })
    @IsOptional()
    @IsDateString({}, { message: 'Informe uma data de nascimento válida no formato AAAA-MM-DD' })
    data_nascimento?: string

    @ApiPropertyOptional({ description: 'Telefone com DDD', example: '85988887777' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{10,11}$/, { message: 'O telefone deve conter DDD e 8 ou 9 dígitos' })
    telefone?: string

    @ApiPropertyOptional({ description: 'CPF do responsável (11 dígitos numéricos)', example: '12345678901' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{11}$/, { message: 'O CPF do responsável deve conter 11 dígitos numéricos' })
    cpf?: string

    @ApiPropertyOptional({ description: 'E-mail do responsável', example: 'responsavel@example.com' })
    @IsOptional()
    @IsEmail({}, { message: 'Informe um e-mail válido para o responsável' })
    email?: string

    @ApiPropertyOptional({ enum: Parentesco, description: 'Grau de parentesco com o paciente', example: Parentesco.MAE })
    @IsOptional()
    @IsEnum(Parentesco, { message: 'Parentesco inválido' })
    parentesco?: Parentesco

    @ApiPropertyOptional({ description: 'Endereço específico do responsável' })
    @IsOptional()
    @ValidateNested()
    @Type(() => AtualizarEnderecoDto)
    endereco?: AtualizarEnderecoDto
}