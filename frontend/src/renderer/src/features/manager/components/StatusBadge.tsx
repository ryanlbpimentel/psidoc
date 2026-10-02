import type { UserStatus } from '@/core/auth/auth.types'
import { cn } from '@/shared/lib/cn'

export const STATUS_LABEL: Record<UserStatus, string> = {
  ATIVO: 'Ativo',
  EM_ANALISE: 'Em análise',
  INATIVO: 'Inativo'
}

const STYLE: Record<UserStatus, string> = {
  ATIVO: 'bg-emerald-50 text-emerald-700',
  EM_ANALISE: 'bg-amber-50 text-orange-600',
  INATIVO: 'bg-slate-100 text-slate-500'
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-medium', STYLE[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  )
}
