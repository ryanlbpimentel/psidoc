import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Info, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { getErrorMessage } from '@/core/http/errors'
import { useBreadcrumbs } from '@/layout/breadcrumbContext'
import { Pager } from '@/shared/components/Pager'
import { buttonVariants } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { cn } from '@/shared/lib/cn'
import { isoToBr } from '@/shared/lib/date'
import { maskCpf } from '@/shared/lib/masks'
import { SituationFilter } from '../components/SituationFilter'
import { patientsService } from '../services/patients.service'
import type { FlashNotice, PatientsPage as PatientsPageData } from '../types'

const PAGE_SIZE = 10
const th = 'px-4 py-3 text-left text-caption font-semibold text-muted'

export function ArchivedPatientsPage() {
  useBreadcrumbs([{ label: 'Pacientes', to: '/pacientes' }, { label: 'Arquivados' }])
  const state = useLocation().state as { notice?: FlashNotice; archivedFirstName?: string } | null
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PatientsPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    patientsService
      .list({ status: 'ARQUIVADO', busca: debouncedSearch, page, pageSize: PAGE_SIZE })
      .then((result) => !cancelled && (setData(result), setError(null)))
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, page])

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const chip = 'rounded-xl px-4 py-2 text-body font-semibold transition'

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold">Pacientes arquivados</h1>
          <p className="mt-0.5 text-body text-muted">Cadastros e históricos preservados, disponíveis para consulta.</p>
        </div>
        <Link to="/pacientes" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft className="size-4" aria-hidden /> Voltar aos ativos
        </Link>
      </div>

      {state?.notice && <Notice tone={state.notice.tone} className="mt-5">{state.notice.message}</Notice>}
      {error && <Notice tone="error" className="mt-4">{error}</Notice>}

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Buscar nos pacientes arquivados</span>
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar nos pacientes arquivados por nome ou CPF..."
            className="h-11 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-body outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
          />
        </label>
        <SituationFilter value="ARQUIVADO" />
      </div>

      <div className="mt-4 flex gap-2">
        <Link to="/pacientes" className={cn(chip, 'border border-line bg-white text-ink hover:bg-slate-50')}>
          Ativos{data?.totais ? ` · ${data.totais.ativos}` : ''}
        </Link>
        <span aria-current="page" className={cn(chip, 'bg-brand-100 text-brand-700')}>
          Arquivados{data?.totais ? ` · ${data.totais.arquivados}` : ''}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        <table className={cn('w-full border-collapse', loading && 'opacity-60 transition-opacity')}>
          <thead>
            <tr className="bg-brand-100/50">
              <th className={th}>Paciente</th>
              <th className={th}>Situação</th>
              <th className={th}>Data do arquivamento</th>
              <th className={th}>Consultar</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-body font-semibold text-brand-700">{p.nome[0]?.toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate text-body font-semibold text-ink">{p.nome}</p>
                      <p className="text-caption text-muted">
                        {isoToBr(p.data_nascimento)} · {p.cpf ? `CPF ${maskCpf(p.cpf)}` : 'Cadastro sem CPF'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full bg-brand-100 px-2.5 py-1 text-caption font-semibold text-brand-700">Arquivado</span>
                </td>
                <td className="px-4 py-3.5">
                  {p.arquivado_em ? (
                    <>
                      <p className="text-body font-medium text-ink">{isoToBr(p.arquivado_em)}</p>
                      {p.arquivado_por && <p className="text-caption text-muted">por {p.arquivado_por}</p>}
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-start gap-1 text-caption font-semibold text-brand-700">
                    <Link to={`/pacientes/${p.id}`} className="hover:underline">Ver ficha</Link>
                    <Link to={`/pacientes/${p.id}/anotacoes`} className="flex items-center gap-1 hover:underline">
                      Registros arquivados <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-body text-muted">
                  {debouncedSearch ? 'Nenhum paciente arquivado encontrado.' : 'Nenhum paciente arquivado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-caption text-muted">
          <span>Exibindo {data?.items.length ?? 0} {data?.items.length === 1 ? 'paciente arquivado' : 'pacientes arquivados'}</span>
          {totalPages > 1 ? <Pager page={page} totalPages={totalPages} onChange={setPage} /> : <span>Mais recentes primeiro</span>}
        </div>
      </div>

      {state?.archivedFirstName && (
        <Notice tone="info" icon={Info} className="mt-4 bg-brand-100/60">
          {state.archivedFirstName} não consta mais nos pacientes ativos. Para consultar o histórico, use Registros arquivados.
        </Notice>
      )}
    </div>
  )
}
