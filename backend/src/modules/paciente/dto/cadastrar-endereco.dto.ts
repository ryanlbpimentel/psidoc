import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

export class CadastrarEnderecoDto {
    @ApiPropertyOptional({ description: 'Logradouro (rua, avenida, etc.)', example: 'Rua das Flores' })
    @IsNotEmpty({ message: 'O logradouro é obrigatório' })
    @IsString()
    logradouro: string

    @ApiPropertyOptional({ description: 'Número do imóvel', example: '123' })
    @IsNotEmpty({ message: 'O numero é obrigatório' })
    @IsString()
    numero: string

    @ApiPropertyOptional({ description: 'Complemento (apto, bloco, etc.)', example: 'Apto 101' })
    @IsOptional()
    @IsString()
    complemento?: string

    @ApiPropertyOptional({ description: 'Bairro', example: 'Centro' })
    @IsNotEmpty({ message: 'O bairro é obrigatório' })
    @IsString()
    bairro: string

    @ApiPropertyOptional({ description: 'Município/Cidade', example: 'Fortaleza' })
    @IsNotEmpty({ message: 'O município é obrigatório' })
    @IsString()
    municipio: string

    @ApiPropertyOptional({ description: 'Sigla do estado (UF)', example: 'CE' })
    @IsNotEmpty({ message: 'O estado é obrigatório' })
    @IsString()
    estado: string

    @ApiPropertyOptional({ description: 'CEP com 8 dígitos numéricos', example: '60000000' })
    @IsNotEmpty({ message: 'O cep é obrigatório' })
    @IsString()
    @Matches(/^\d{8}$/, { message: 'O CEP deve conter exatamente 8 dígitos numéricos' })
    cep: string
}