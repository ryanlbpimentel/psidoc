import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsOptional } from 'class-validator'

export class ConsultarAgendaDto {
    @ApiPropertyOptional({
        description: 'Início do período, inclusive (ISO 8601)',
        example: '2026-10-25T00:00:00-03:00',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Informe uma data de início válida (ISO 8601)' })
    data_inicio?: string

    @ApiPropertyOptional({
        description: 'Fim do período, inclusive (ISO 8601)',
        example: '2026-10-25T23:59:59-03:00',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Informe uma data de fim válida (ISO 8601)' })
    data_fim?: string
}
