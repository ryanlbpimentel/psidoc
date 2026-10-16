import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Matches } from 'class-validator'

export class AtualizarEnderecoDto {
    @ApiPropertyOptional({ description: 'Logradouro (rua, avenida, etc.)', example: 'Rua das Flores' })
    @IsOptional()
    @IsString()
    logradouro?: string

    @ApiPropertyOptional({ description: 'Número do imóvel', example: '123' })
    @IsOptional()
    @IsString()
    numero?: string

    @ApiPropertyOptional({ description: 'Complemento (apto, bloco, etc.)', example: 'Apto 101' })
    @IsOptional()
    @IsString()
    complemento?: string

    @ApiPropertyOptional({ description: 'Bairro', example: 'Centro' })
    @IsOptional()
    @IsString()
    bairro?: string

    @ApiPropertyOptional({ description: 'Município/Cidade', example: 'Fortaleza' })
    @IsOptional()
    @IsString()
    municipio?: string

    @ApiPropertyOptional({ description: 'Sigla do estado (UF)', example: 'CE' })
    @IsOptional()
    @IsString()
    estado?: string

    @ApiPropertyOptional({ description: 'CEP com 8 dígitos numéricos', example: '60000000' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{8}$/, { message: 'O CEP deve conter exatamente 8 dígitos numéricos' })
    cep?: string
}