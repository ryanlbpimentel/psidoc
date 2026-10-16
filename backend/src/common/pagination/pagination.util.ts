import { PaginationDto } from './pagination.dto'
import { PaginatedResult } from './pagination.interface'

export function extrairPaginacao(dto?: Partial<PaginationDto>) {
    const pagina = Math.max(1, Number(dto?.pagina) || 1)
    const limite = Math.min(100, Math.max(1, Number(dto?.limite) || 10))
    const skip = (pagina - 1) * limite

    return { skip, take: limite, pagina, limite }
}

export function formatarPaginacao<T>(itens: T[], total: number, pagina: number, limite: number): PaginatedResult<T> {
    return { itens, total, pagina, limite, total_paginas: Math.ceil(total / limite) || 1 }
}

export async function paginarPrisma<T, WhereInput, OrderByInput, SelectOrInclude>(
    model: {
        count: (args: { where?: WhereInput }) => Promise<number>
        findMany: (args: any) => Promise<T[]>
    },
    queryArgs: {
        where?: WhereInput
        orderBy?: OrderByInput
        include?: SelectOrInclude
        select?: SelectOrInclude
    },
    paginacaoDto?: Partial<PaginationDto>,
): Promise<PaginatedResult<T>> {
    const { skip, take, pagina, limite } = extrairPaginacao(paginacaoDto)

    const [total, itens] = await Promise.all([
        model.count({ where: queryArgs.where }),
        model.findMany({
            where: queryArgs.where,
            orderBy: queryArgs.orderBy,
            include: queryArgs.include,
            select: queryArgs.select,
            skip,
            take,
        }),
    ])

    return formatarPaginacao(itens, total, pagina, limite)
}