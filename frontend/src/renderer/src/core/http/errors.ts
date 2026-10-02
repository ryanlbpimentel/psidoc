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
    if (!error.response) {
      return new ApiError(0, 'Não foi possível conectar ao servidor.', 'NETWORK_ERROR')
    }

    const { status, data } = error.response

    let rawMessage: string
    if (Array.isArray(data?.message)) {
      rawMessage = data.message.join('. ')
    } else {
      rawMessage = data?.message ?? DEFAULT_MESSAGES[status] ?? 'Ocorreu um erro inesperado.'
    }

    let code: string | undefined = data?.code
    if (!code) {
      if (rawMessage.toLowerCase().includes('em análise')) {
        code = 'PENDING_APPROVAL'
      } else if (rawMessage.toLowerCase().includes('expirado') || rawMessage.toLowerCase().includes('código inválido')) {
        code = 'INVALID_RESET_TOKEN'
      }
    }

    return new ApiError(status, rawMessage, code, data?.errors)
  }

  return new ApiError(500, DEFAULT_MESSAGES[500])
}

export const getErrorMessage = (error: unknown) => normalizeError(error).message