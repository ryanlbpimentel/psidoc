import { isAxiosError } from 'axios'

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string>

  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

// Tabela de erros HTTP do PDF de stack (seção 9)
const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos ou requisição incorreta.',
  401: 'Você não está autenticado ou a sessão expirou.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Já existe um registro com esses dados.',
  422: 'Erro de validação. Revise os campos informados.',
  500: 'Erro interno do servidor. Tente novamente em instantes.'
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isAxiosError(error)) {
    if (!error.response) return new ApiError(0, 'Não foi possível conectar ao servidor.', 'NETWORK_ERROR')
    const { status, data } = error.response
    return new ApiError(
      status,
      data?.message ?? DEFAULT_MESSAGES[status] ?? 'Ocorreu um erro inesperado.',
      data?.code,
      data?.errors
    )
  }
  return new ApiError(500, DEFAULT_MESSAGES[500])
}

export const getErrorMessage = (error: unknown) => normalizeError(error).message
