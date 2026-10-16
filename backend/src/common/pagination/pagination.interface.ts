export interface PaginatedResult<T> {
    itens: T[]
    total: number
    pagina: number
    limite: number
    total_paginas: number
}