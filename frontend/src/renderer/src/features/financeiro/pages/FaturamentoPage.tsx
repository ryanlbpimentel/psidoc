import { useEffect, useState } from 'react'
import { CalendarDays, ChevronDown, CloudOff, ReceiptText, RefreshCw } from 'lucide-react'
import { fmtDateBr } from '@/features/agenda/lib/time'
import { useBreadcrumbs } from '@/layout/breadcrumbContext'
import { Button } from '@/shared/components/ui/Button'
import { StateCard } from '@/shared/components/StateCard'
import { formatBRL } from '@/shared/lib/format'
import { FinanceiroHeader } from '../components/FinanceiroHeader'
import { currentMonth, fmtMonth } from '../lib/format'
import { financeiroService } from '../services/financeiro.service'
import type { Faturamento } from '../types'

export function FaturamentoPage() {
  useBreadcrumbs([{ label: 'Financeiro', to: '/financeiro' }, { label: 'Faturamento mensal' }])
  const [mes, setMes] = useState(currentMonth)
  const [data, setData] = useState<Faturamento | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!mes) return
    let cancelled = false
    setStatus('loading')
    financeiroService
      .faturamento(mes)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [mes, reloadKey])

  const total = status === 'ready' && data ? formatBRL(data.total) : '—'

  return (
    <div className="mx-auto max-w-[1100px]">
      <FinanceiroHeader title="Faturamento mensal" subtitle="Consulte os pagamentos recebidos no período selecionado." />

      <section aria-label="Mês de recebimento" className="mt-5 grid overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[1.6fr_1fr]">
        <div className="p-5">
          <label htmlFor="mes" className="block text-body font-medium text-ink">Mês de recebimento</label>
          <div className="relative mt-1.5 max-w-[260px]">
            <CalendarDays aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-ink" />
            <input
              id="mes"
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value || currentMonth())}
              className="relative h-11 w-full rounded-xl border border-line bg-slate-50 pr-10 pl-10 text-body text-ink outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 z-10 size-4 -translate-y-1/2 text-ink" />
          </div>
          <p className="mt-2 text-caption text-muted">Considera pagamentos recebidos no mês selecionado</p>
        </div>
        <div className="bg-brand-700 p-5 text-white" aria-live="polite">
          <p className="text-caption font-medium text-white/85">Total recebido no mês</p>
          <p className="mt-1.5 text-[28px] leading-tight font-bold">{total}</p>
          <p className="mt-1.5 text-caption text-white/85">{fmtMonth(mes)}</p>
        </div>
      </section>

      <div className="mt-6">
        <h2 className="mb-3 text-body font-bold text-ink">Recebimentos do mês</h2>

        {status === 'loading' && !data && (
          <ul aria-busy="true" aria-label="Carregando recebimentos" className="space-y-3">
            {[0, 1, 2].map((i) => <li key={i} className="h-[48px] animate-pulse rounded-2xl border border-line bg-slate-100/70" />)}
          </ul>
        )}

        {status === 'error' && (
          <StateCard icon={CloudOff} tone="danger" title="Não foi possível carregar o faturamento"
            actions={<Button onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="size-4" aria-hidden /> Tentar novamente</Button>}>
            Não conseguimos consultar os recebimentos agora. Tente novamente.
          </StateCard>
        )}

        {status !== 'error' && data && data.recebimentos.length === 0 && (
          <StateCard icon={ReceiptText} title="Nenhum recebimento neste mês">
            Não há pagamentos recebidos em {fmtMonth(mes)}.
          </StateCard>
        )}

        {status !== 'error' && data && data.recebimentos.length > 0 && (
          <div className={status === 'loading' ? 'opacity-60 transition-opacity' : undefined}>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <table className="w-full text-left">
                <thead className="bg-brand-100/60 text-caption text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Data de recebimento</th>
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 text-right font-medium">Valor recebido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.recebimentos.map((r) => (
                    <tr key={r.id} className="text-body text-ink">
                      <td className="px-5 py-3">{fmtDateBr(r.pago_em)}</td>
                      <td className="px-5 py-3">{r.paciente.nome}</td>
                      <td className="px-5 py-3 text-right font-semibold">{formatBRL(r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
