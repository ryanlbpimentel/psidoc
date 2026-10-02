import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '@/core/http/api'
import { loginRequest, type LoginPayload } from './auth.api'
import type { SessionUser } from './auth.types'
import { sessionFromToken, tokenStorage } from './token'

interface AuthContextValue {
  user: SessionUser | null
  isAuthenticated: boolean
  login: (credentials: LoginPayload) => Promise<SessionUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function restoreSession(): SessionUser | null {
  const token = tokenStorage.get()
  if (!token) return null
  const user = sessionFromToken(token)
  if (!user) tokenStorage.clear() // token inválido ou expirado
  return user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(restoreSession)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const login = useCallback<AuthContextValue['login']>(async (credentials) => {
    const { token, user } = await loginRequest(credentials)
    tokenStorage.set(token)
    setUser(user)
    return user
  }, [])

  // 401 vindo da API (token inválido) derruba a sessão em qualquer tela.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
