import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthContext'
import { isUsingMock } from '@/core/http/apiStatus'
import { Breadcrumbs, BreadcrumbProvider } from './breadcrumb'
import { LogoutDialog } from './LogoutDialog'
import { Sidebar } from './Sidebar'

/** Estrutura das telas logadas: sidebar + barra superior + conteúdo. */
export function AppLayout() {
  return (
    <BreadcrumbProvider>
      <AppShell />
    </BreadcrumbProvider>
  )
}

function AppShell() {
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
        <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-8 text-caption text-muted">
          <div className="min-w-0">
            <Breadcrumbs />
            {areaLabel && (
              <p className="hidden [&:only-child]:block">
                PSIDOC <span className="mx-1.5">/</span> <span className="font-semibold text-ink">{areaLabel}</span>
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {isUsingMock() && (
              <span title="Parte da aplicação ainda usa dados fictícios (API não implementada)" className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                Dados de demonstração
              </span>
            )}
            {!inGestorArea && (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" aria-hidden /> Ambiente clínico seguro
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-page p-8">
          <Outlet />
        </main>
      </div>
      <LogoutDialog open={confirmingLogout} onCancel={() => setConfirmingLogout(false)} onConfirm={handleLogout} />
    </div>
  )
}
