import { useEffect, useState } from 'react'
import { consultaService } from '../services/consulta.service'
import { endOfDayIso, fmtTime, startOfDayIso, todayYmd } from '../lib/time'
import type { Consulta } from '../types'

export function TodayAgenda() {
  const [items, setItems] = useState<Consulta[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    consultaService
      .list({ from: startOfDayIso(todayYmd()), to: endOfDayIso(todayYmd()) })
      .then((result) => !cancelled && setItems(result))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [])

  if (failed) return <p className="py-4 text-body text-muted">Não foi possível carregar a agenda de hoje.</p>
  if (!items) return <div aria-busy="true" className="h-[120px] animate-pulse rounded-xl bg-slate-100/70" />
  if (items.length === 0) return <p className="py-4 text-body text-muted">Nenhuma consulta agendada para hoje.</p>

  return (
    <ul className="space-y-2.5">
      {items.map((c) => (
        <li key={c.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="rounded-lg bg-brand-100 px-2 py-1 text-caption font-semibold text-brand-700">{fmtTime(c.inicio)}</span>
          <span className="flex-1 truncate text-body font-semibold">{c.paciente.nome}</span>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-caption font-medium text-brand-700">{c.local}</span>
        </li>
      ))}
    </ul>
  )
}
