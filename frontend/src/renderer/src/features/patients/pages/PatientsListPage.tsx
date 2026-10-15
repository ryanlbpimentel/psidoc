import { useEffect, useState } from 'react'
import { Archive, Search, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/core/http/errors'
import { useBreadcrumbs } from '@/layout/breadcrumbContext'
import { Pager } from '@/shared/components/Pager'
import { Button, buttonVariants } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { cn } from '@/shared/lib/cn'
import { NewPatientDialog } from '../components/NewPatientDialog'
import { PatientCard } from '../components/PatientCard'
import { SituationFilter } from '../components/SituationFilter'
import { LIST_PAGE_SIZE } from '../constants'
import { patientsService } from '../services/patients.service'
import type { PatientsPage as PatientsPageData } from '../types'

export function PatientsListPage() {
  useBreadcrumbs([{ label: 'Pacientes' }])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PatientsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    patientsService
      .list({ status: 'ATIVO', busca: debouncedSearch, page, pageSize: LIST_PAGE_SIZE })
      .then((result) => !cancelled && (setData(result), setError(null)))
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, page])

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * LIST_PAGE_SIZE + 1
  const to = Math.min(page * LIST_PAGE_SIZE, total)

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold">Pacientes</h1>
          <p className="mt-0.5 text-body text-muted">Consulte os cadastros e encontre cada paciente com facilidade.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <UserPlus className="size-4" aria-hidden /> Cadastrar paciente
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Buscar paciente</span>
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar paciente por nome ou CPF..."
            className="h-11 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-body outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
          />
        </label>
        <SituationFilter value="ATIVO" />
        <Link to="/pacientes/arquivados" className={buttonVariants({ variant: 'outline' })}>
          <Archive className="size-4" aria-hidden /> Pacientes arquivados
        </Link>
      </div>

      {error && <Notice tone="error" className="mt-4">{error}</Notice>}

      <p className="mt-4 text-caption text-muted">
        {data ? `${total} ${total === 1 ? 'paciente ativo' : 'pacientes ativos'}` : 'Carregando…'}
      </p>

      {data && data.items.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="text-body font-semibold text-ink">
            {debouncedSearch ? 'Nenhum paciente encontrado.' : 'Você ainda não tem pacientes ativos.'}
          </p>
          <p className="mt-1 text-body text-muted">
            {debouncedSearch ? 'Confira o nome ou o CPF digitado.' : 'Use "Cadastrar paciente" para começar.'}
          </p>
        </div>
      ) : (
        <div className={cn('mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60 transition-opacity')}>
          {data?.items.map((p) => <PatientCard key={p.id} patient={p} />)}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="mt-5 flex items-center justify-between text-caption text-muted">
          <span>Exibindo {from}–{to} de {total} {total === 1 ? 'paciente' : 'pacientes'}</span>
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      <NewPatientDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
