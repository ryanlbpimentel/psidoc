import type { SessionUser, TokenPayload, UserRole } from './auth.types'

const KEY = 'psidoc:token'

export const tokenStorage = {
  get: () => localStorage.getItem(KEY),
  set: (token: string) => localStorage.setItem(KEY, token),
  clear: () => localStorage.removeItem(KEY)
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as TokenPayload
  } catch {
    return null
  }
}

export function sessionFromToken(token: string): SessionUser | null {
  const payload = decodeToken(token)
  if (!payload) return null

  if (payload.exp && payload.exp * 1000 < Date.now()) return null

  const roles: UserRole[] = []
  if (payload.roles && payload.roles.length > 0) {
    roles.push(...payload.roles)
  } else if (payload.role) {
    roles.push(payload.role)
  }

  if (payload.crp && !roles.includes('PSICOLOGO')) {
    roles.push('PSICOLOGO')
  }

  if (payload.nivel_permissao === 10 && !roles.includes('GESTOR')) {
    roles.push('GESTOR')
  }

  if (roles.length === 0) {
    roles.push('PSICOLOGO')
  }

  const id = String(payload.sub ?? payload.id_usuario ?? '')
  const name = payload.name ?? payload.nome ?? payload.email.split('@')[0]

  return {
    id,
    name,
    email: payload.email,
    roles,
    crp: payload.crp
  }
}