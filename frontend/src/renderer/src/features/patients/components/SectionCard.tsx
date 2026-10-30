import type { ReactNode } from 'react'
import { Check, Info, ShieldAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export type SectionState = 'saved' | 'dirty' | 'unsaved' | 'unregistered'

const STATE = {
  saved: { label: 'Salvo', className: 'bg-emerald-50 text-emerald-700', icon: Check },
  dirty: { label: 'Alterações não salvas', className: 'bg-amber-50 text-orange-600', icon: ShieldAlert },
  unsaved: { label: 'Atenção: não salvo', className: 'bg-amber-50 text-orange-600', icon: ShieldAlert },
  unregistered: { label: 'Não cadastrado', className: 'bg-slate-100 text-muted', icon: Info }
} as const

export function SectionStatus({ state }: { state: SectionState }) {
  const { label, className, icon: Icon } = STATE[state]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold', className)}>
      <Icon className="size-3.5" aria-hidden /> {label}
    </span>
  )
}

interface SectionCardProps {
  title: string
  aside?: ReactNode
  description?: string
  children: ReactNode
  className?: string
}

/** Bloco da ficha ("Dados pessoais", "Endereço", "Responsáveis legais"). */
export function SectionCard({ title, aside, description, children, className }: SectionCardProps) {
  return (
    <section aria-label={title} className={cn('rounded-2xl border border-line bg-white p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lead font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-caption text-muted">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function ReadField({ label, value, className }: { label: string; value?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-caption text-muted">{label}</p>
      <p className="mt-1 text-body font-medium break-words text-ink">
        {value || <span className="font-normal text-muted">Não informado</span>}
      </p>
    </div>
  )
}
