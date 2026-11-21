import { useEffect, useState } from 'react'
import { CalendarSearch, CloudOff, Funnel, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { PickerField } from '@/shared/components/ui/PickerField'
import { StateCard } from '@/shared/components/StateCard'
import { useNow } from '@/shared/hooks/useNow'
import { ConsultaRow } from '../components/ConsultaRow'
import { NewConsultaDialog } from '../components/NewConsultaDialog'
import { ReminderDialog } from '../components/ReminderDialog'
import { addDays, dayKey, endOfDayIso, fmtDateBr, fmtDayHeader, fmtPeriod, fmtRange, fmtYmdBr, groupByDay, startOfDayIso, toYmd, todayYmd } from '../lib/time'
import { consultaService } from '../services/consulta.service'
import type { Consulta } from '../types'

interface Period {
  from: string // AAAA-MM-DD
  to: string
}

// Sem período o back devolve a agenda inteira; por isso sempre há um período aplicado (hoje e amanhã, como no Figma).
const defaultPeriod = (): Period => ({ from: todayYmd(), to: addDays(todayYmd(), 1) })

export function AgendaPage() {
  const now = useNow(30_000)
  const [applied, setApplied] = useState<Period>(defaultPeriod)
  const [draft, setDraft] = useState<Period>(defaultPeriod)
  const [periodError, setPeriodError] = useState<string | null>(null)
  const [items, setItems] = useState<Consulta[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [creating, setCreating] = useState(false)
  const [reminderFor, setReminderFor] = useState<Consulta | null>(null)
  const [created, setCreated] = useState<Consulta | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    consultaService
      .list({ from: startOfDayIso(applied.from), to: endOfDayIso(applied.to) })
      .then((result) => {
        if (cancelled) return
        setItems([...result].sort((a, b) => a.inicio.localeCompare(b.inicio)))
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [applied, reloadKey])

  const applyPeriod = () => {
    if (!draft.from || !draft.to) return setPeriodError('Informe a data inicial e a data final.')
    if (draft.from > draft.to) return setPeriodError('A data final não pode ser anterior à data inicial.')
    setPeriodError(null)
    setCreated(null)
    setApplied({ ...draft })
  }

  const clearFilters = () => {
    const base = defaultPeriod()
    setPeriodError(null)
    setCreated(null)
    setDraft(base)
    setApplied(base)
  }

  const handleCreated = (consulta: Consulta) => {
    // Se a nova consulta cai fora do período exibido, ampliamos o período para ela aparecer.
    const day = dayKey(consulta.inicio)
    const next = { from: day < applied.from ? day : applied.from, to: day > applied.to ? day : applied.to }
    setCreated(consulta)
    setDraft(next)
    setApplied(next)
    setReloadKey((k) => k + 1)
  }

  const today = toYmd(new Date(now))
  const groups = groupByDay(items)

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-ink">Agenda</h1>
          <p className="mt-0.5 text-body text-muted">Consulte seus horários e organize os próximos atendimentos.</p>
        </div>
        <Button onClick={() => { setCreated(null); setCreating(true) }}>
          <Plus className="size-4" aria-hidden /> Nova consulta
        </Button>
      </div>

      {created && (
        <Notice tone="success" className="mt-5">
          <p className="font-semibold">Consulta agendada</p>
          <p>{created.paciente.nome} · {fmtDateBr(created.inicio)} · {fmtRange(created)} · {created.local}</p>
        </Notice>
      )}

      <section aria-label="Filtro por período" className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-[190px]">
            <PickerField label="Data inicial" type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} />
          </div>
          <div className="w-[190px]">
            <PickerField label="Data final" type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} />
          </div>
          <Button onClick={applyPeriod}>
            <Funnel className="size-4" aria-hidden /> Aplicar período
          </Button>
          <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
        </div>
        {periodError && <p role="alert" className="mt-3 text-caption text-danger">{periodError}</p>}
      </section>

      <div className="mt-5">
        {status === 'loading' && items.length === 0 && (
          <ul aria-busy="true" aria-label="Carregando agenda" className="space-y-3">
            {[0, 1, 2].map((i) => <li key={i} className="h-[66px] animate-pulse rounded-2xl border border-line bg-slate-100/70" />)}
          </ul>
        )}

        {status === 'error' && (
          <StateCard icon={CloudOff} tone="danger" title="Não foi possível carregar a agenda"
            actions={<Button onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="size-4" aria-hidden /> Tentar novamente</Button>}>
            Não conseguimos consultar seus horários agora. Tente novamente.
          </StateCard>
        )}

        {status === 'ready' && items.length === 0 && (
          <StateCard icon={CalendarSearch} title="Nenhuma consulta neste período"
            actions={<>
              <Button onClick={clearFilters}>Limpar filtros</Button>
              <Button variant="outline" onClick={() => setCreating(true)}>Nova consulta</Button>
            </>}>
            Não há consultas de {fmtYmdBr(applied.from)} a {fmtYmdBr(applied.to)}. Altere o período ou agende uma nova consulta.
          </StateCard>
        )}

        {status !== 'error' && items.length > 0 && (
          <div className={status === 'loading' ? 'opacity-60 transition-opacity' : undefined}>
            <p className="mb-4 text-caption text-muted">
              {fmtPeriod(applied.from, applied.to)} · {items.length} {items.length === 1 ? 'consulta' : 'consultas'}
            </p>
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.key} aria-label={fmtDayHeader(group.key)}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="text-body font-bold text-ink">{fmtDayHeader(group.key)}</h2>
                    {group.key === today && <span className="text-caption text-muted">Hoje</span>}
                  </div>
                  <ul className="space-y-3">
                    {group.items.map((c) => (
                      <ConsultaRow key={c.id} consulta={c} now={now} highlighted={created?.id === c.id} onReminder={setReminderFor} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      <NewConsultaDialog open={creating} defaultDate={applied.from > today ? applied.from : today} onClose={() => setCreating(false)} onCreated={handleCreated} />
      <ReminderDialog consulta={reminderFor} onClose={() => setReminderFor(null)} />
    </div>
  )
}
