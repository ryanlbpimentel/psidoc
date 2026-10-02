export type UserRole = 'PSICOLOGO' | 'GESTOR'
export type UserStatus = 'ATIVO' | 'EM_ANALISE' | 'INATIVO'

export interface SessionUser {
  id: string
  name: string
  email: string
  /** Um usuário pode acumular perfis: um psicólogo também pode ser gestor. */
  roles: UserRole[]
  crp?: string
}

export interface LoginResponse {
  token: string
  user: SessionUser
}

export interface TokenPayload {
  sub: string
  name: string
  email: string
  roles: UserRole[]
  /** Formato antigo (um perfil só). Aceito na leitura para não derrubar sessões já salvas. */
  role?: UserRole
  crp?: string
  exp: number // segundos (padrão JWT)
}

export const hasRole = (user: Pick<SessionUser, 'roles'> | null | undefined, role: UserRole) =>
  !!user?.roles.includes(role)
