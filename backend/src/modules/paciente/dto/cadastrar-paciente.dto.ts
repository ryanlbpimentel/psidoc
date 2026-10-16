import { ApiProperty } from '@nestjs/swagger'
import {
    IsDateString,
    IsNotEmpty,
    IsString,
} from 'class-validator'

export class CadastrarPacienteDto {
    @ApiProperty({ description: 'Nome completo do paciente', example: 'Lucas Souza' })
    @IsString()
    @IsNotEmpty({ message: 'O nome do paciente é obrigatório' })
    nome: string

    @ApiProperty({ description: 'Data de nascimento (AAAA-MM-DD)', example: '2010-08-20' })
    @IsDateString({}, { message: 'Informe uma data de nascimento válida no formato AAAA-MM-DD' })
    @IsNotEmpty({ message: 'A data de nascimento é obrigatória' })
    data_nascimento: string
}