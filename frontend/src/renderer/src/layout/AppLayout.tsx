import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import { isUsingMock } from '@/core/http/apiStatus'
import { LogoutDialog } from './LogoutDialog'
import { Sidebar } from './Sidebar'

/** Estrutura das telas logadas: sidebar + barra superior + conteúdo. */
export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  if (!user) return null // ProtectedRoute já garante o usuário; isso só satisfaz o TypeScript

  // Na área do gestor, e para quem acumula os dois perfis, mostra em qual área está.
  const inGestorArea = pathname.startsWith('/gestor')
  const areaLabel = inGestorArea ? 'Área do gestor' : user.roles.includes('GESTOR') ? 'Área do psicólogo' : null

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full">
      <Sidebar user={user} onLogout={() => setConfirmingLogout(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-line bg-white px-8 text-caption text-muted">
          {areaLabel ? (
            <p>
              PSIDOC <span className="mx-1.5">/</span> <span className="font-semibold text-ink">{areaLabel}</span>
            </p>
          ) : (
            <span />
          )}
          {isUsingMock() && (
            <span title="Parte da aplicação ainda usa dados fictícios (API não implementada)" className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
              Dados de demonstração
            </span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto bg-page p-8">
          <Outlet />
        </main>
      </div>
      <LogoutDialog open={confirmingLogout} onCancel={() => setConfirmingLogout(false)} onConfirm={handleLogout} />
    </div>
  )
}
