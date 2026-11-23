import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { STATUS_LABEL, type StatusPagamento } from '../types'

const TABS = [
  { to: '/financeiro', label: 'Pagamentos', end: true },
  { to: '/financeiro/faturamento', label: 'Faturamento mensal', end: true },
  { to: '/financeiro/pacotes', label: 'Pacotes', end: false }
]

interface FinanceiroHeaderProps {
  title: string
  subtitle: string
  action?: ReactNode
}

/** Título da página + abas do financeiro (Pagamentos · Faturamento mensal · Pacotes). */
export function FinanceiroHeader({ title, subtitle, action }: FinanceiroHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-ink">{title}</h1>
          <p className="mt-0.5 text-body text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      <nav aria-label="Seções do financeiro" className="mt-5 flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn('-mb-px border-b-2 px-5 py-2.5 text-body font-medium transition', isActive ? 'border-brand-700 text-brand-700' : 'border-transparent text-muted hover:text-ink')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export function StatusBadge({ status }: { status: StatusPagamento }) {
  return (
    <span className={cn('rounded-full px-3 py-0.5 text-caption font-semibold', status === 'PAGA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
      {STATUS_LABEL[status]}
    </span>
  )
}
