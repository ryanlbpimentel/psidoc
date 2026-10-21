import { ApiProperty } from '@nestjs/swagger'
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
} from 'class-validator'

export class AgendarConsultaDto {
    @ApiProperty({ description: 'ID do paciente', example: 1 })
    @IsInt({ message: 'O paciente da consulta é obrigatório' })
    id_paciente: number

    @ApiProperty({ description: 'Data e horário de início (ISO 8601)', example: '2026-10-25T14:00:00-03:00' })
    @IsDateString({}, { message: 'Informe uma data e um horário de início válidos' })
    @Matches(/T\d{2}:\d{2}/, { message: 'O horário de início é obrigatório (ex.: 2026-10-25T14:00:00-03:00)' })
    inicio: string

    @ApiProperty({ description: 'Local do atendimento', example: 'Consultório Centro' })
    @IsString()
    @IsNotEmpty({ message: 'O local da consulta é obrigatório' })
    @MaxLength(255, { message: 'O local da consulta deve ter no máximo 255 caracteres' })
    local: string
}
