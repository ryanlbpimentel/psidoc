import { useEffect, useState } from 'react'
import { CloudOff, Layers, RefreshCw, UserSearch } from 'lucide-react'
import { PatientCombobox, type PatientOption } from '@/features/agenda/components/PatientCombobox'
import { fmtYmdBr } from '@/features/agenda/lib/time'
import { useBreadcrumbs } from '@/layout/breadcrumbContext'
import { Button } from '@/shared/components/ui/Button'
import { SelectField } from '@/shared/components/ui/SelectField'
import { StateCard } from '@/shared/components/StateCard'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/format'
import { FinanceiroHeader, StatusBadge } from '../components/FinanceiroHeader'
import { pacoteLabel } from '../lib/format'
import { financeiroService } from '../services/financeiro.service'
import type { PacotePaciente } from '../types'

export function ParcelasPage() {
  useBreadcrumbs([{ label: 'Financeiro', to: '/financeiro' }, { label: 'Pacotes', to: '/financeiro/pacotes' }, { label: 'Parcelas' }])
  const [paciente, setPaciente] = useState<PatientOption | null>(null)
  const [pacotes, setPacotes] = useState<PacotePaciente[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!paciente) return
    let cancelled = false
    setStatus('loading')
    financeiroService
      .pacotesDoPaciente(paciente.id)
      .then((result) => {
        if (cancelled) return
        setPacotes(result)
        setSelectedId(result[0]?.id ?? '')
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [paciente, reloadKey])

  const pacote = pacotes.find((p) => p.id === selectedId)
  const pago = pacote?.parcelas.filter((p) => p.status === 'PAGA').reduce((s, p) => s + p.valor, 0) ?? 0
  const pendente = pacote?.parcelas.filter((p) => p.status === 'PENDENTE').reduce((s, p) => s + p.valor, 0) ?? 0

  return (
    <div className="mx-auto max-w-[1100px]">
      <FinanceiroHeader title="Parcelas do pacote" subtitle="Acompanhe os valores pagos e pendentes do pacote selecionado." />

      <section aria-label="Paciente e pacote" className="mt-5 grid gap-4 rounded-2xl border border-line bg-surface p-5 md:grid-cols-2">
        <PatientCombobox value={paciente} onChange={setPaciente} />
        <SelectField
          label="Pacote selecionado"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={status !== 'ready' || pacotes.length === 0}
          placeholder={pacotes.length === 0 ? 'Nenhum pacote' : undefined}
          options={pacotes.map((p) => ({ value: p.id, label: pacoteLabel(p) }))}
        />
      </section>

      <div className="mt-6">
        {status === 'idle' && (
          <StateCard icon={UserSearch} title="Selecione um paciente">
            Escolha um paciente para ver os pacotes e as parcelas dele.
          </StateCard>
        )}

        {status === 'loading' && (
          <ul aria-busy="true" aria-label="Carregando parcelas" className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => <li key={i} className="h-[92px] animate-pulse rounded-2xl border border-line bg-slate-100/70" />)}
          </ul>
        )}

        {status === 'error' && (
          <StateCard icon={CloudOff} tone="danger" title="Não foi possível carregar as parcelas"
            actions={<Button onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="size-4" aria-hidden /> Tentar novamente</Button>}>
            Não conseguimos consultar os pacotes do paciente agora. Tente novamente.
          </StateCard>
        )}

        {status === 'ready' && !pacote && (
          <StateCard icon={Layers} title="Nenhum pacote para este paciente">
            {paciente?.nome} não tem pacote de sessões com parcelas.
          </StateCard>
        )}

        {status === 'ready' && pacote && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Total label="Valor total do pacote" value={pacote.valor_total} className="text-brand-700" />
              <Total label="Total pago" value={pago} className="text-emerald-700" />
              <Total label="Total pendente" value={pendente} className="text-ink" />
            </div>

            <div className="mt-6 mb-3 flex items-center justify-between">
              <h2 className="text-body font-bold text-ink">
                Parcelas · {pacote.parcelas.length} de {formatBRL(pacote.parcelas[0]?.valor ?? 0)}
              </h2>
              <span className="text-caption text-muted">{pacote.quantidade_sessoes} sessões no pacote</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <table className="w-full text-left">
                <thead className="bg-brand-100/60 text-caption text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Parcela</th>
                    <th className="px-5 py-3 font-medium">Vencimento</th>
                    <th className="px-5 py-3 font-medium">Valor</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pacote.parcelas.map((p) => (
                    <tr key={p.numero} className="text-body text-ink">
                      <td className="px-5 py-4 font-semibold">{p.numero} de {pacote.parcelas.length}</td>
                      <td className="px-5 py-4">{fmtYmdBr(p.vencimento)}</td>
                      <td className="px-5 py-4 font-semibold">{formatBRL(p.valor)}</td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-caption text-muted">As parcelas de pacotes não entram no faturamento mensal.</p>
          </>
        )}
      </div>
    </div>
  )
}

function Total({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-caption text-muted">{label}</p>
      <p className={cn('mt-1.5 text-[24px] leading-tight font-bold', className)}>{formatBRL(value)}</p>
    </div>
  )
}
