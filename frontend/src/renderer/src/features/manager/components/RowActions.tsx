import { useEffect, useRef, useState } from 'react'
import { EllipsisVertical } from 'lucide-react'
import type { UserStatus } from '@/core/auth/auth.types'
import { cn } from '@/shared/lib/cn'

interface Action {
  label: string
  status: UserStatus
  danger?: boolean
}

const ACTIONS: Record<UserStatus, Action[]> = {
  EM_ANALISE: [
    { label: 'Aprovar acesso', status: 'ATIVO' },
    { label: 'Recusar cadastro', status: 'INATIVO', danger: true }
  ],
  ATIVO: [{ label: 'Inativar acesso', status: 'INATIVO', danger: true }],
  INATIVO: [{ label: 'Reativar acesso', status: 'ATIVO' }]
}

interface RowActionsProps {
  name: string
  status: UserStatus
  disabled?: boolean
  onSelect: (status: UserStatus) => void
}

export function RowActions({ name, status, disabled, onSelect }: RowActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Ações para ${name}`}
        className="cursor-pointer rounded-lg p-1.5 text-ink transition hover:bg-slate-100 disabled:opacity-50"
      >
        <EllipsisVertical className="size-4" />
      </button>
      {open && (
        <ul role="menu" className="absolute top-full right-0 z-20 mt-1 w-44 rounded-xl border border-line bg-white p-1 shadow-lg">
          {ACTIONS[status].map((action) => (
            <li key={action.status} role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  onSelect(action.status)
                }}
                className={cn('w-full cursor-pointer rounded-lg px-3 py-2 text-left text-body transition hover:bg-slate-50', action.danger ? 'text-danger' : 'text-ink')}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
