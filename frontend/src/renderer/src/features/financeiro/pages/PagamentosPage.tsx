import { useEffect, useState } from 'react'
import { CloudOff, ReceiptText, RefreshCw, UserSearch } from 'lucide-react'
import { PatientCombobox, type PatientOption } from '@/features/agenda/components/PatientCombobox'
import { fmtDateBr, fmtRange } from '@/features/agenda/lib/time'
import { useBreadcrumbs } from '@/layout/breadcrumbContext'
import { Button } from '@/shared/components/ui/Button'
import { StateCard } from '@/shared/components/StateCard'
import { formatBRL } from '@/shared/lib/format'
import { FinanceiroHeader, StatusBadge } from '../components/FinanceiroHeader'
import { RegistrarPagamentoDialog } from '../components/RegistrarPagamentoDialog'
import { financeiroService } from '../services/financeiro.service'
import type { PagamentoSessao } from '../types'

export function PagamentosPage() {
  useBreadcrumbs([{ label: 'Financeiro', to: '/financeiro' }, { label: 'Pagamentos' }])
  const [paciente, setPaciente] = useState<PatientOption | null>(null)
  const [items, setItems] = useState<PagamentoSessao[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState<PagamentoSessao | null>(null)

  useEffect(() => {
    if (!paciente) return
    let cancelled = false
    setStatus('loading')
    financeiroService
      .pagamentos(paciente.id)
      .then((result) => {
        if (cancelled) return
        setItems(result)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [paciente, reloadKey])

  const onSaved = (saved: PagamentoSessao) => setItems((list) => list.map((s) => (s.id === saved.id ? saved : s)))

  return (
    <div className="mx-auto max-w-[1100px]">
      <FinanceiroHeader title="Pagamentos por paciente" subtitle="Consulte as sessões pagas e pendentes do paciente selecionado." />

      <section aria-label="Paciente" className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <div className="max-w-[380px]">
          <PatientCombobox value={paciente} onChange={setPaciente} />
        </div>
      </section>

      <div className="mt-6">
        {status === 'idle' && (
          <StateCard icon={UserSearch} title="Selecione um paciente">
            Escolha um paciente para ver as sessões pagas e os pagamentos pendentes.
          </StateCard>
        )}

        {status === 'loading' && items.length === 0 && (
          <ul aria-busy="true" aria-label="Carregando pagamentos" className="space-y-3">
            {[0, 1, 2].map((i) => <li key={i} className="h-[56px] animate-pulse rounded-2xl border border-line bg-slate-100/70" />)}
          </ul>
        )}

        {status === 'error' && (
          <StateCard icon={CloudOff} tone="danger" title="Não foi possível carregar os pagamentos"
            actions={<Button onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="size-4" aria-hidden /> Tentar novamente</Button>}>
            Não conseguimos consultar os pagamentos agora. Tente novamente.
          </StateCard>
        )}

        {status === 'ready' && items.length === 0 && (
          <StateCard icon={ReceiptText} title="Nenhuma sessão encontrada">
            {paciente?.nome} ainda não tem sessões agendadas.
          </StateCard>
        )}

        {paciente && status !== 'error' && status !== 'idle' && items.length > 0 && (
          <section aria-label={`Sessões de ${paciente.nome}`} className={status === 'loading' ? 'opacity-60 transition-opacity' : undefined}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-body font-bold text-ink">Sessões de {paciente.nome}</h2>
              <span className="text-caption text-muted">{items.length} {items.length === 1 ? 'sessão' : 'sessões'}</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <table className="w-full text-left">
                <thead className="bg-brand-100/60 text-caption text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Sessão</th>
                    <th className="px-5 py-3 font-medium">Valor da sessão</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td className="px-5 py-3">
                        <p className="text-body font-semibold text-ink">{fmtDateBr(s.inicio)}</p>
                        <p className="text-caption text-muted">{fmtRange(s)} · {s.local}</p>
                      </td>
                      <td className="px-5 py-3 text-body font-semibold text-ink">{formatBRL(s.valor)}</td>
                      <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-3">
                        <Button variant="outline" size="sm" onClick={() => setEditing(s)}>Registrar status</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <RegistrarPagamentoDialog sessao={editing} pacienteNome={paciente?.nome ?? ''} onClose={() => setEditing(null)} onSaved={onSaved} />
    </div>
  )
}
