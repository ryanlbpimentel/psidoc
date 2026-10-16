import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class PaginationDto {
    @ApiPropertyOptional({
        description: 'Número da página',
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'A página deve ser um número inteiro' })
    @Min(1, { message: 'A página mínima é 1' })
    pagina: number = 1

    @ApiPropertyOptional({
        description: 'Quantidade de registros por página',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'O limite deve ser um número inteiro' })
    @Min(1, { message: 'O limite mínimo é 1' })
    @Max(100, { message: 'O limite máximo por página é 100' })
    limite: number = 10
}