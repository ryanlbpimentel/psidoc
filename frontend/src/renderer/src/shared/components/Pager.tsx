import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

function PagerButton({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode
}) {
  return (
    <button
      type="button" aria-label={label} aria-current={active ? 'page' : undefined} disabled={disabled} onClick={onClick}
      className={cn('flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-caption font-semibold transition hover:bg-slate-50 disabled:opacity-40', active && 'border-brand-100 bg-brand-100 text-brand-700')}
    >
      {children}
    </button>
  )
}

export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <PagerButton label="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft className="size-4" /></PagerButton>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <PagerButton key={n} label={`Página ${n}`} active={n === page} onClick={() => onChange(n)}>{n}</PagerButton>
      ))}
      <PagerButton label="Próxima página" disabled={page >= totalPages} onClick={() => onChange(page + 1)}><ChevronRight className="size-4" /></PagerButton>
    </div>
  )
}
