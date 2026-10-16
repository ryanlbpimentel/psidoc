import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { StatusPaciente } from '@prisma/client'
import { PaginationDto } from '@common/pagination/pagination.dto'

export class ConsultarPacienteDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Termo de busca para filtrar por nome ou CPF do paciente',
        example: 'Lucas',
    })
    @IsOptional()
    @IsString()
    busca?: string

    @ApiPropertyOptional({
        enum: StatusPaciente,
        description: 'Filtrar por status atual do paciente',
        example: StatusPaciente.ATIVO,
    })
    @IsOptional()
    @IsEnum(StatusPaciente, { message: 'Status de paciente inválido' })
    status?: StatusPaciente
}