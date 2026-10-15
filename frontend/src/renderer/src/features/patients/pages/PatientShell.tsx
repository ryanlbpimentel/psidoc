import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, Eye, Pencil } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/core/http/errors'
import { useBreadcrumbs } from '@/layout/breadcrumbContext'
import { Button, buttonVariants } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { cn } from '@/shared/lib/cn'
import { ageFromIso } from '@/shared/lib/date'
import { ArchiveDialog } from '../components/ArchiveDialog'
import { DeleteDialog } from '../components/DeleteDialog'
import { DiscardDialog } from '../components/DiscardDialog'
import { statusLabel } from '../constants'
import { patientsService } from '../services/patients.service'
import type { Patient } from '../types'

export interface PatientOutletContext {
  patient: Patient
  setPatient: (patient: Patient) => void
  /** A tela de edição informa quais blocos têm alterações não salvas. */
  setDirtySections: (sections: string[]) => void
  /** Sai para outra rota, pedindo confirmação se houver alterações não salvas. */
  requestLeave: (to: string) => void
  requestDelete: () => void
}

// "Dados cadastrais" virou Prontuário; o antigo "Prontuário" (registros das sessões) virou Anotações.
const TABS = [
  { label: 'Prontuário', path: '' },
  { label: 'Anotações', path: 'anotacoes' },
  { label: 'Anamnese', path: 'anamnese' },
  { label: 'Evolução', path: 'evolucao' },
  { label: 'Financeiro', path: 'financeiro' },
  { label: 'Anexos', path: 'anexos' }
]

/** Cabeçalho (nome, idade, situação) e abas comuns a todas as telas do paciente. */
export function PatientShell() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState<string[]>([])
  const [leaveTo, setLeaveTo] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPatient(null)
    setError(null)
    setDirty([])
    patientsService
      .get(id)
      .then((p) => !cancelled && setPatient(p))
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [id])

  const base = `/pacientes/${id}`
  const section = pathname.slice(base.length).replace(/^\//, '')
  const isEdit = section === 'editar'
  const archived = patient?.status === 'ARQUIVADO'

  const crumbs = useMemo(() => {
    if (!patient) return [{ label: 'Pacientes', to: '/pacientes' }]
    if (isEdit) return [{ label: 'Pacientes', to: '/pacientes' }, { label: 'Editar dados' }]
    if (archived) {
      return [
        { label: 'Pacientes', to: '/pacientes/arquivados' },
        { label: section === 'anotacoes' ? 'Registros arquivados' : 'Ficha arquivada' }
      ]
    }
    return [{ label: 'Pacientes', to: '/pacientes' }, { label: patient.nome }]
  }, [patient, isEdit, archived, section])
  useBreadcrumbs(crumbs)

  const requestLeave = useCallback(
    (to: string) => {
      if (dirty.length === 0) navigate(to)
      else setLeaveTo(to)
    },
    [dirty, navigate]
  )
  const requestDelete = useCallback(() => setDeleting(true), [])

  const context = useMemo(
    () => (patient ? { patient, setPatient, setDirtySections: setDirty, requestLeave, requestDelete } : null),
    [patient, requestLeave, requestDelete]
  )

  if (error) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-4">
        <Notice tone="error">{error}</Notice>
        <Link to="/pacientes" className={buttonVariants({ variant: 'outline' })}>Voltar para pacientes</Link>
      </div>
    )
  }
  if (!patient || !context) return <p className="mx-auto max-w-[1080px] text-body text-muted">Carregando ficha…</p>

  const activeTab = isEdit ? '' : section
  const pill = archived ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-800'

  return (
    <div className="mx-auto max-w-[1080px]">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lead font-semibold text-brand-700">
            {patient.nome[0]?.toUpperCase()}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[20px] leading-tight font-bold text-ink">{patient.nome}</h1>
              <span className={cn('rounded-full px-2.5 py-0.5 text-caption font-semibold', pill)}>{statusLabel(patient)}</span>
            </div>
            <p className="mt-0.5 text-caption text-muted">
              {ageFromIso(patient.data_nascimento)} anos{isEdit ? ' · Editando dados' : ''}
            </p>
          </div>
        </div>

        {isEdit ? (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-caption font-semibold text-brand-700">Edição de dados</span>
        ) : archived ? (
          <span className="flex items-center gap-1.5 text-body text-muted"><Eye className="size-4" aria-hidden /> Somente leitura</span>
        ) : (
          <div className="flex gap-2.5">
            <Link to={`${base}/editar`} className={buttonVariants()}>
              <Pencil className="size-4" aria-hidden /> Editar dados
            </Link>
            <Button variant="outline" onClick={() => setArchiving(true)}>
              <Archive className="size-4" aria-hidden /> Arquivar paciente
            </Button>
          </div>
        )}
      </header>

      <nav aria-label="Seções da ficha" className="mt-5 flex flex-wrap gap-x-6 border-b border-line">
        {TABS.map((tab) => {
          const to = tab.path ? `${base}/${tab.path}` : base
          const active = tab.path === activeTab
          return (
            <NavLink
              key={tab.label}
              to={to}
              end
              aria-current={active ? 'page' : undefined}
              onClick={(e) => {
                if (dirty.length > 0) {
                  e.preventDefault()
                  requestLeave(to)
                }
              }}
              className={cn(
                '-mb-px border-b-2 px-0.5 py-3 text-body transition',
                active ? 'border-brand-700 font-semibold text-brand-700' : 'border-transparent font-medium text-muted hover:text-ink'
              )}
            >
              {tab.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-5">
        <Outlet context={context} />
      </div>

      {patient.status === 'ATIVO' && <ArchiveDialog patient={patient} open={archiving} onClose={() => setArchiving(false)} />}
      {archived && <DeleteDialog patient={patient} open={deleting} onClose={() => setDeleting(false)} />}
      <DiscardDialog
        open={leaveTo !== null}
        sections={dirty}
        onKeepEditing={() => setLeaveTo(null)}
        onDiscard={() => {
          const to = leaveTo
          setDirty([])
          setLeaveTo(null)
          if (to) navigate(to)
        }}
      />
    </div>
  )
}
