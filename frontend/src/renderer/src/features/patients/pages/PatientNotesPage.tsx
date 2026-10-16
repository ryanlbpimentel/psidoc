import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Funnel, Info, Lock, Search } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { getErrorMessage } from '@/core/http/errors'
import { Notice } from '@/shared/components/ui/Notice'
import { cn } from '@/shared/lib/cn'
import { formatDateTimeBr, isoToBr } from '@/shared/lib/date'
import { isFemale } from '../constants'
import { patientsService } from '../services/patients.service'
import type { Patient, PatientRecord } from '../types'
import type { PatientOutletContext } from './PatientShell'

/** Anotações. Para paciente arquivado mostra os registros preservados, só para leitura. */
export function PatientNotesPage() {
  const { patient } = useOutletContext<PatientOutletContext>()
  if (patient.status !== 'ARQUIVADO') {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
        <p className="text-body font-semibold text-ink">Anotações das sessões</p>
        <p className="mt-1 text-body text-muted">Esta área ainda não foi implementada.</p>
      </div>
    )
  }
  return <ArchivedRecords patient={patient} />
}

type TypeFilter = 'TODOS' | PatientRecord['tipo']

function ArchivedRecords({ patient }: { patient: Patient }) {
  const [records, setRecords] = useState<PatientRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TypeFilter>('TODOS')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const f = isFemale(patient)

  useEffect(() => {
    let cancelled = false
    patientsService
      .listRecords(patient.id)
      .then((r) => !cancelled && setRecords(r))
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [patient.id])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (records ?? [])
      .filter((r) => type === 'TODOS' || r.tipo === type)
      .filter(
        (r) =>
          !q ||
          [r.titulo, r.conteudo, r.autor, r.local, formatDateTimeBr(r.data_hora)].some((field) => field.toLowerCase().includes(q))
      )
  }, [records, search, type])

  const selected = visible.find((r) => r.id === selectedId) ?? visible[0] ?? null

  return (
    <div className="space-y-5">
      <Notice tone="info" icon={Info} className="bg-brand-100/60">
        Paciente arquivad{f ? 'a' : 'o'}{patient.arquivado_em ? ` em ${isoToBr(patient.arquivado_em)}` : ''}. Registros preservados em modo
        somente leitura; não é possível editá-los nesta consulta.
      </Notice>
      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex items-baseline justify-between">
        <h2 className="text-lead font-semibold">Registros arquivados</h2>
        <p className="text-caption text-muted">
          {records ? `${records.length} ${records.length === 1 ? 'registro' : 'registros'}` : 'Carregando…'} · Mais recentes primeiro
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Buscar nos registros</span>
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por conteúdo, data ou autoria..."
            className="h-11 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-body outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Filtrar por tipo</span>
          <Funnel className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TypeFilter)}
            className="h-11 cursor-pointer appearance-none rounded-xl border border-line bg-white pr-9 pl-10 text-body font-medium outline-none focus:border-brand-700"
          >
            <option value="TODOS">Tipo: Todos os registros</option>
            <option value="OBSERVACAO">Tipo: Observações clínicas</option>
            <option value="ACOMPANHAMENTO">Tipo: Acompanhamento</option>
          </select>
        </label>
      </div>

      {records && visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-body text-muted">
          Nenhum registro encontrado. Ajuste a busca ou o tipo.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <ul className="space-y-2.5">
            {visible.map((r) => {
              const active = r.id === selected?.id
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-left transition hover:border-brand-700/50',
                      active ? 'border-brand-700 bg-brand-100/40' : 'border-line'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-caption font-bold text-brand-700">{formatDateTimeBr(r.data_hora)}</span>
                      <span className="mt-0.5 block truncate text-body font-semibold text-ink">{r.titulo}</span>
                      <span className="block truncate text-caption text-muted">{r.autor} · {r.local}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>

          {selected && (
            <article className="rounded-2xl border border-line bg-white p-6">
              <div className="flex items-center justify-between gap-3 text-caption text-muted">
                <span>{formatDateTimeBr(selected.data_hora)} · {selected.local}</span>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-semibold text-brand-700">Arquivado</span>
              </div>
              <h3 className="mt-3 text-title font-semibold text-ink">{selected.titulo}</h3>
              <p className="mt-3 text-body font-semibold text-ink">{selected.autor}</p>
              <p className="text-caption text-muted">CRP {selected.autor_crp} · Registro de {patient.nome}</p>
              <p className="mt-4 border-t border-line pt-4 text-body leading-relaxed text-ink">{selected.conteudo}</p>
              <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-caption text-muted">
                <Lock className="size-3.5" aria-hidden /> Conteúdo preservado no arquivamento d{f ? 'a' : 'o'} paciente. Consulta somente leitura.
              </p>
            </article>
          )}
        </div>
      )}
    </div>
  )
}
