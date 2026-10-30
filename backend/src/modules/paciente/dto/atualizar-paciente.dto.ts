import { ApiPropertyOptional } from '@nestjs/swagger'
import {
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator'
import { Genero, StatusPaciente } from '@prisma/client'

export class AtualizarPacienteDto {
    @ApiPropertyOptional({ description: 'Nome completo do paciente', example: 'Lucas Souza Santos' })
    @IsOptional()
    @IsString()
    nome?: string

    @ApiPropertyOptional({ description: 'Data de nascimento (AAAA-MM-DD)', example: '2010-08-20' })
    @IsOptional()
    @IsDateString({}, { message: 'Informe uma data de nascimento válida no formato AAAA-MM-DD' })
    data_nascimento?: string

    @ApiPropertyOptional({ description: 'Telefone com DDD', example: '85999998888' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{10,11}$/, { message: 'O telefone deve conter DDD e 8 ou 9 dígitos' })
    telefone?: string

    @ApiPropertyOptional({ description: 'CPF do paciente (11 dígitos numéricos)', example: '98765432100' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{11}$/, { message: 'O CPF do paciente deve conter 11 dígitos numéricos' })
    cpf?: string

    @ApiPropertyOptional({ enum: Genero, description: 'Gênero do paciente', example: Genero.MASCULINO })
    @IsOptional()
    @IsEnum(Genero, { message: 'Gênero informado é inválido' })
    genero?: Genero

    @ApiPropertyOptional({ description: 'Renda familiar para registro socioeconômico', example: 4200.0 })
    @IsOptional()
    @IsNumber({}, { message: 'A renda familiar deve ser um número decimal' })
    @Min(0, { message: 'A renda familiar não pode ser negativa' })
    @Max(99999999.99, { message: 'A renda familiar deve ser inferior a R$ 100.000.000,00' })
    renda_familiar?: number

    @ApiPropertyOptional({ description: 'Observações do paciente', example: 'Evoluindo bem nas sessões.' })
    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'As observações devem ter no máximo 5000 caracteres' })
    observacoes?: string

    @ApiPropertyOptional({
        enum: StatusPaciente,
        description: 'Status do paciente',
        example: StatusPaciente.ATIVO,
    })
    @IsOptional()
    @IsEnum(StatusPaciente, { message: 'Status de paciente inválido' })
    status?: StatusPaciente
}