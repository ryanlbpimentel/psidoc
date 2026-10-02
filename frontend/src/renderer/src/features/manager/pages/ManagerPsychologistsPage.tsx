import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock, Funnel, RotateCw, Search, Users } from 'lucide-react'
import { getErrorMessage } from '@/core/http/errors'
import { Notice } from '@/shared/components/ui/Notice'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { cn } from '@/shared/lib/cn'
import { initials } from '@/shared/lib/format'
import { RowActions } from '../components/RowActions'
import { StatusBadge } from '../components/StatusBadge'
import { managerService, type PsychologistsPage, type StatusFilter, type ManagerAction } from '../services/manager.service'
import { useAuth } from '@/core/auth/AuthContext'

const PAGE_SIZE = 5
const FILTERS: StatusFilter[] = ['TODOS', 'EM_ANALISE', 'APROVADO', 'ATIVO', 'INATIVO']

const FILTER_LABEL: Record<StatusFilter, string> = {
  TODOS: 'Todos',
  EM_ANALISE: 'Pendente',
  APROVADO: 'Aprovado',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo'
}

const th = 'px-4 py-3 text-left text-caption font-semibold tracking-wide text-muted uppercase'

export function ManagerPsychologistsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<StatusFilter>('TODOS')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState<PsychologistsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    managerService
      .list({ search: debouncedSearch, status, page, pageSize: PAGE_SIZE })
      .then((result) => !cancelled && (setData(result), setError(null)))
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, status, page, reloadKey])

  const handleAction = async (id: string, name: string, action: ManagerAction) => {
    setFeedback(null)
    try {
      await managerService.executeAction(id, action)
      const messages: Record<ManagerAction, string> = {
        APROVAR: 'cadastro aprovado com sucesso.',
        REPROVAR: 'cadastro reprovado e removido.',
        INATIVAR: 'acesso desativado com sucesso.',
        ATIVAR: 'acesso ativado com sucesso.'
      }
      setFeedback(`${name}: ${messages[action]}`)
      setReloadKey((k) => k + 1)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const summary = data?.summary
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))
  const activePct = summary && summary.registered ? Math.round((summary.active / summary.registered) * 100) : 0

  return (
    <div className="mx-auto max-w-[960px]">
      <h1 className="text-title font-semibold">Psicólogos</h1>
      <p className="mt-0.5 text-body text-muted">Gerencie os profissionais e acompanhe o acesso à plataforma.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard label="Profissionais cadastrados" value={summary?.registered} hint="na clínica" icon={Users} tone="bg-brand-100 text-brand-700" />
        <StatCard label="Acessos ativos" value={summary?.active} hint={`${activePct}% do total`} hintClass="text-emerald-600" icon={CircleCheck} tone="bg-emerald-50 text-emerald-600" />
        <StatCard label="Em análise" value={summary?.pending} hint="aguardando aprovação" hintClass="text-orange-600" icon={Clock} tone="bg-amber-50 text-orange-600" />
      </div>

      <div className="mt-4 flex gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Buscar profissional</span>
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nome, e-mail ou CRP"
            className="h-11 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-body outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Filtrar por status</span>
          <Funnel className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter)
              setPage(1)
            }}
            className="h-11 cursor-pointer appearance-none rounded-xl border border-line bg-white pr-9 pl-10 text-body font-medium outline-none focus:border-brand-700"
          >
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                Status: {FILTER_LABEL[f]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={loading}
          title="Atualizar lista"
          className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 text-body font-medium text-ink transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RotateCw className={cn('size-4 text-muted', loading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {feedback && <Notice tone="success" className="mt-4">{feedback}</Notice>}
      {error && <Notice tone="error" className="mt-4">{error}</Notice>}

      <div className="mt-4 rounded-2xl border border-line bg-white">
        <table className={cn('w-full border-collapse', loading && 'opacity-60 transition-opacity')}>
          <thead>
            <tr className="bg-slate-50">
              <th className={cn(th, 'rounded-tl-2xl')}>Nome</th>
              <th className={th}>E-mail</th>
              <th className={th}>CRP</th>
              <th className={th}>Validação</th>
              <th className={th}>Status</th>
              <th className={cn(th, 'w-12 rounded-tr-2xl')}><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => {
              const isSelf = String(p.id) === String(user?.id)

              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-brand-100 text-caption font-semibold text-brand-700">{initials(p.name)}</span>
                      <span className="text-body font-semibold">{p.name}</span>
                      {isSelf && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                          Você
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-caption text-muted">{p.email}</td>
                  <td className="px-4 py-3 text-caption font-semibold">{p.crp}</td>
                  <td className="px-4 py-3"><ValidationBadge status={p.validacao} /></td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {isSelf ? (
                      <span className="text-caption font-medium text-slate-400 italic">Sua conta</span>
                    ) : (
                      <RowActions
                        name={p.name}
                        status={p.status}
                        validacao={p.validacao}
                        disabled={loading}
                        onSelect={(action) => handleAction(p.id, p.name, action)}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-body text-muted">Nenhum profissional encontrado. Ajuste a busca ou o filtro de status.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-caption text-muted">
          <span>Mostrando {data?.items.length ?? 0} de {data?.total ?? 0} profissionais</span>
          <div className="flex items-center gap-1.5">
            <PagerButton label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /></PagerButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <PagerButton key={n} label={`Página ${n}`} active={n === page} onClick={() => setPage(n)}>{n}</PagerButton>
            ))}
            <PagerButton label="Próxima página" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></PagerButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, hint, hintClass, icon: Icon, tone }: {
  label: string; value?: number; hint: string; hintClass?: string; icon: typeof Users; tone: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
      <div>
        <p className="text-caption text-muted">{label}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-title font-bold">{value ?? '—'}</span>
          <span className={cn('text-caption', hintClass ?? 'text-cyan-brand')}>{hint}</span>
        </p>
      </div>
      <span className={cn('flex size-9 items-center justify-center rounded-xl', tone)}><Icon className="size-4" aria-hidden /></span>
    </div>
  )
}

function PagerButton({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode
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

function ValidationBadge({ status }: { status: 'PENDENTE' | 'VALIDADO' }) {
  const isValidated = status === 'VALIDADO'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-medium',
        isValidated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-orange-600'
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {isValidated ? 'Validado' : 'Pendente'}
    </span>
  )
}