import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface StateCardProps {
  icon: LucideIcon
  tone?: 'brand' | 'danger'
  title: string
  children?: ReactNode
  actions?: ReactNode
}

/** Cartão central para estados vazios e de erro (sem consultas, falha ao carregar, sem sessão…). */
export function StateCard({ icon: Icon, tone = 'brand', title, children, actions }: StateCardProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      <span className={cn('flex size-12 items-center justify-center rounded-xl', tone === 'danger' ? 'bg-rose-50 text-danger' : 'bg-brand-100 text-brand-700')}>
        <Icon className="size-5" aria-hidden />
      </span>
      <h2 className="mt-5 text-lead font-bold text-ink">{title}</h2>
      {children && <p className="mt-2 max-w-[420px] text-body leading-relaxed whitespace-pre-line text-muted">{children}</p>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
