export type UserRole = 'PSICOLOGO' | 'GESTOR'
export type UserStatus = 'ATIVO' | 'EM_ANALISE' | 'INATIVO'

export interface SessionUser {
  id: string
  name: string
  email: string
  roles: UserRole[]
  crp?: string
}

export interface BackendLoginResponse {
  access_token: string
}

export interface LoginResponse {
  token: string
  user: SessionUser
}

export interface TokenPayload {
  sub: string | number
  id_usuario?: number
  name?: string
  nome?: string
  email: string
  roles?: UserRole[]
  crp?: string
  exp: number
}

export const hasRole = (user: Pick<SessionUser, 'roles'> | null | undefined, role: UserRole) => !!user?.roles.includes(role)