import type { SessionUser, TokenPayload } from './auth.types'

const KEY = 'psidoc:token'

// A sessão sempre fica salva: o usuário continua logado ao reabrir o app, até clicar em "Sair"
// ou o token expirar.
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
  if (!payload || payload.exp * 1000 < Date.now()) return null
  const roles = payload.roles?.length ? payload.roles : payload.role ? [payload.role] : []
  if (roles.length === 0) return null
  return { id: payload.sub, name: payload.name, email: payload.email, roles, crp: payload.crp }
}
