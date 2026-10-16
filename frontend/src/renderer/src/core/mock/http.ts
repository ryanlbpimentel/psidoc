import type { TokenPayload, UserRole } from '@/core/auth/auth.types'
import { decodeToken } from '@/core/auth/token'

export class MockHttpError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string>
  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export interface MockRequest {
  method: string
  path: string
  query: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  token: string | null
}

export interface MockResult {
  status: number
  data: unknown
}

export interface MockRoute {
  method: string
  pattern: RegExp
  handler: (req: MockRequest, params: string[]) => MockResult
}

/** Confere o token (falso) e devolve quem está logado. */
export function requireRole(req: MockRequest, role: UserRole): TokenPayload {
  const payload = req.token ? decodeToken(req.token) : null
  if (!payload || payload.exp * 1000 < Date.now()) throw new MockHttpError(401, 'Sessão expirada. Entre novamente.')
  const roles = payload.roles ?? []
  if (!roles.includes(role)) throw new MockHttpError(403, 'Você não tem permissão para acessar este recurso.')
  return payload
}
