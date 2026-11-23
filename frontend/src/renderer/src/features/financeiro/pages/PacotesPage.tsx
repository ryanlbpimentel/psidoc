import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudOff, Layers, ListChecks, Plus, RefreshCw } from 'lucide-react'
import { useBreadcrumbs } from '@/layout/breadcrumbContext'
import { Button, buttonVariants } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { StateCard } from '@/shared/components/StateCard'
import { formatBRL } from '@/shared/lib/format'
import { CadastrarPacoteDialog } from '../components/CadastrarPacoteDialog'
import { FinanceiroHeader } from '../components/FinanceiroHeader'
import { pacoteLabel } from '../lib/format'
import { financeiroService } from '../services/financeiro.service'
import type { Pacote } from '../types'

export function PacotesPage() {
  useBreadcrumbs([{ label: 'Financeiro', to: '/financeiro' }, { label: 'Pacotes' }])
  const [items, setItems] = useState<Pacote[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<Pacote | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    financeiroService
      .pacotes()
      .then((result) => {
        if (cancelled) return
        setItems(result)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const onCreated = (pacote: Pacote) => {
    setCreated(pacote)
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <FinanceiroHeader
        title="Pacotes de sessões"
        subtitle="Consulte a quantidade de sessões e o valor dos pacotes cadastrados."
        action={
          <div className="flex gap-2.5">
            <Link to="/financeiro/pacotes/parcelas" className={buttonVariants({ variant: 'outline' })}>
              <ListChecks className="size-4" aria-hidden /> Acompanhar parcelas
            </Link>
            <Button onClick={() => { setCreated(null); setCreating(true) }}>
              <Plus className="size-4" aria-hidden /> Cadastrar pacote
            </Button>
          </div>
        }
      />

      {created && (
        <Notice tone="success" className="mt-5">
          <p className="font-semibold">Pacote cadastrado</p>
          <p>{pacoteLabel(created)}</p>
        </Notice>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-body font-bold text-ink">Pacotes cadastrados</h2>

        {status === 'loading' && items.length === 0 && (
          <ul aria-busy="true" aria-label="Carregando pacotes" className="space-y-3">
            {[0, 1].map((i) => <li key={i} className="h-[52px] animate-pulse rounded-2xl border border-line bg-slate-100/70" />)}
          </ul>
        )}

        {status === 'error' && (
          <StateCard icon={CloudOff} tone="danger" title="Não foi possível carregar os pacotes"
            actions={<Button onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="size-4" aria-hidden /> Tentar novamente</Button>}>
            Não conseguimos consultar os pacotes agora. Tente novamente.
          </StateCard>
        )}

        {status === 'ready' && items.length === 0 && (
          <StateCard icon={Layers} title="Nenhum pacote cadastrado"
            actions={<Button onClick={() => setCreating(true)}><Plus className="size-4" aria-hidden /> Cadastrar pacote</Button>}>
            Cadastre um pacote informando a quantidade de sessões e o valor total.
          </StateCard>
        )}

        {status !== 'error' && items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <table className="w-full text-left">
              <thead className="bg-brand-100/60 text-caption text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Quantidade de sessões</th>
                  <th className="px-5 py-3 text-right font-medium">Valor total do pacote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((p) => (
                  <tr key={p.id} className={created?.id === p.id ? 'bg-emerald-50/60' : undefined}>
                    <td className="px-5 py-4 text-body font-semibold text-ink">{p.quantidade_sessoes} {p.quantidade_sessoes === 1 ? 'sessão' : 'sessões'}</td>
                    <td className="px-5 py-4 text-right text-body font-bold text-ink">{formatBRL(p.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CadastrarPacoteDialog open={creating} onClose={() => setCreating(false)} onCreated={onCreated} />
    </div>
  )
}
