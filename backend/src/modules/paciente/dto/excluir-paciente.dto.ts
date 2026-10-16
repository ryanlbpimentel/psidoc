import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class ExcluirPacienteDto {
    @ApiProperty({
        description: 'Senha de login do psicólogo para confirmar a exclusão permanente',
        example: 'SenhaForte@123',
    })
    @IsString({ message: 'A senha deve ser uma string' })
    @IsNotEmpty({ message: 'A senha de confirmação é obrigatória' })
    senha: string
}