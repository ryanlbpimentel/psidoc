import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { statusLabel } from '@/features/patients/constants'
import { patientsService } from '@/features/patients/services/patients.service'
import type { PatientsPage } from '@/features/patients/types'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { cn } from '@/shared/lib/cn'

export interface PatientOption {
  id: string
  nome: string
}

export function registrationLabel(name: string) {
  const words = name.trim().split(/\s+/)
  if (words.length < 2) return name
  return `${words.slice(0, -1).map((w) => w[0].toUpperCase()).join('')} ${words[words.length - 1]}`
}

interface PatientComboboxProps {
  value: PatientOption | null
  onChange: (value: PatientOption) => void
  error?: string
}

export function PatientCombobox({ value, onChange, error }: PatientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const debounced = useDebouncedValue(term, 300)
  const [data, setData] = useState<PatientsPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setFailed(false)
    patientsService
      .list({ busca: debounced.trim(), page: 1, pageSize: 20 })
      .then((result) => {
        if (cancelled) return
        setData(result)
        setActive(0)
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [open, debounced])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const items = data?.items ?? []
  const choose = (p: PatientOption) => {
    onChange({ id: p.id, nome: p.nome })
    setOpen(false)
    setTerm('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[active]) choose(items[active])
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      e.nativeEvent.stopPropagation() // fecha só a lista, não o modal
      setOpen(false)
    }
  }

  const summary = failed
    ? 'Não foi possível buscar os pacientes.'
    : loading && !data
      ? 'Buscando pacientes…'
      : `${data?.total ?? 0} ${data?.total === 1 ? 'paciente encontrado' : 'pacientes encontrados'}${term.trim() ? ` para “${term.trim()}”` : ''}`

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <label className="block text-body font-medium text-ink" htmlFor={`${listId}-field`}>
        Paciente *
      </label>
      {open ? (
        <div className="relative">
          <input
            id={`${listId}-field`}
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar por nome ou CPF"
            className="h-11 w-full rounded-xl border border-brand-700 bg-white px-3.5 pr-10 text-body text-ink outline-none ring-2 ring-brand-700/20"
          />
          <Search aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
        </div>
      ) : (
        <button
          id={`${listId}-field`}
          type="button"
          role="combobox"
          aria-expanded={false}
          aria-controls={listId}
          aria-invalid={!!error}
          onClick={() => setOpen(true)}
          className={cn(
            'flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-slate-50 px-3.5 text-left text-body transition focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20',
            error && 'border-danger'
          )}
        >
          {value ? <span className="truncate text-ink">{value.nome}</span> : <span className="text-slate-400">Selecione um paciente</span>}
          <ChevronDown aria-hidden className="size-4 shrink-0 text-ink" />
        </button>
      )}

      {open && (
        <div className="absolute top-full right-0 left-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-line bg-white shadow-[0_16px_40px_-16px_rgba(15,31,61,0.35)]">
          <p className="px-4 py-2.5 text-caption text-muted" aria-live="polite">{summary}</p>
          {!failed && (
            <ul id={listId} role="listbox" className="px-1.5 pb-1.5">
              {items.map((p, index) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    choose(p)
                  }}
                  className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2', index === active && 'bg-brand-100')}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-body font-bold text-brand-700">{p.nome[0]?.toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-body font-semibold text-ink">{p.nome}</span>
                    <span className="block truncate text-caption text-muted">
                      Cadastro: {registrationLabel(p.nome)} · {statusLabel(p)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && !open && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
