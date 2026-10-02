export enum ResultadoValidacaoCfp {
    VALIDO = 'VALIDO',
    INVALIDO = 'INVALIDO',
    INDISPONIVEL = 'INDISPONIVEL',
}

export interface InfosimplesCfpItem {
    nome: string
    nome_regional: string
    registro: string
    situacao: string
    data_inscricao: string
}

export interface InfosimplesApiResponse {
    code?: number
    code_message?: string
    data?: { resultados?: InfosimplesCfpItem[] }[]
}

export interface ValidacaoCfpResult {
    resultado: ResultadoValidacaoCfp
    motivo?: string
    dados?: InfosimplesCfpItem
}