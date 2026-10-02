import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import type { SessionUser } from '@/core/auth/auth.types'
import { BrandLogo } from '@/shared/components/BrandLogo'
import { cn } from '@/shared/lib/cn'
import { initials } from '@/shared/lib/format'
import { navigationFor } from './navigation'

export function Sidebar({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const { sections, showTitles } = navigationFor(user.roles)
  const isGestorOnly = !user.roles.includes('PSICOLOGO')
  return (
    <aside className="flex w-[196px] shrink-0 flex-col bg-linear-to-b from-brand-900 via-brand-700 to-cyan-brand px-3 py-6 lg:w-[220px]">
      <BrandLogo size="sm" className="px-2" />

      <nav aria-label="Navegação principal" className="mt-10 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        {sections.map(({ role, title, items }) => (
          <div key={role} className="flex flex-col gap-1.5">
            {showTitles && (
              <p className="mb-1 px-3 text-caption font-semibold tracking-wide text-white/70 uppercase">
                {isGestorOnly ? 'Administração' : title}
              </p>
            )}
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium transition',
                    isActive ? 'bg-white text-brand-900' : 'text-white/90 hover:bg-white/10'
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-6 flex items-center gap-2.5 px-1">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-body font-semibold text-white">
          {initials(user.name, 1)}
        </span>
        <div className="min-w-0 flex-1 text-white">
          <p className="truncate text-caption font-semibold">{user.name}</p>
          <p className="truncate text-[10px] text-white/80">{isGestorOnly ? 'Gestão da clínica' : `CRP ${user.crp ?? '—'}`}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2 py-1.5 text-caption font-semibold text-white transition hover:bg-white/20"
        >
          <LogOut className="size-3.5" aria-hidden /> Sair
        </button>
      </div>
    </aside>
  )
}
