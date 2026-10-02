import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { SessionUser, UserRole } from './auth.types'

/** Home de cada área. Quem tem os dois perfis começa pela área do psicólogo. */
export const AREA_HOME: Record<UserRole, string> = {
  PSICOLOGO: '/painel',
  GESTOR: '/gestor/psicologos'
}

export const homePathFor = (user: Pick<SessionUser, 'roles'>) =>
  user.roles.includes('PSICOLOGO') ? AREA_HOME.PSICOLOGO : AREA_HOME.GESTOR

/** Rotas privadas. Sem login → /login. Sem nenhum dos perfis exigidos → home do próprio usuário. */
export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.some((r) => user.roles.includes(r))) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/** Login/cadastro/recuperar senha: quem já está logado vai direto para o painel. */
export function PublicOnlyRoute() {
  const { user } = useAuth()
  if (user) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}
