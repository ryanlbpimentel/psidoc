import { useEffect, useState } from 'react'
import { Info, Wallet, X } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { fmtDateBr, fmtRange } from '@/features/agenda/lib/time'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { cn } from '@/shared/lib/cn'
import { formatBRL } from '@/shared/lib/format'
import { financeiroService } from '../services/financeiro.service'
import { STATUS_LABEL, type PagamentoSessao, type StatusPagamento } from '../types'

interface RegistrarPagamentoDialogProps {
  sessao: PagamentoSessao | null
  pacienteNome: string
  onClose: () => void
  onSaved: (sessao: PagamentoSessao) => void
}

export function RegistrarPagamentoDialog({ sessao, pacienteNome, onClose, onSaved }: RegistrarPagamentoDialogProps) {
  const [status, setStatus] = useState<StatusPagamento>('PENDENTE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessao) return
    setStatus(sessao.status)
    setError(null)
  }, [sessao])

  if (!sessao) return null

  const changed = status !== sessao.status
  const close = () => !saving && onClose()

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      onSaved(await financeiroService.registrarPagamento(sessao.id, status))
      onClose()
    } catch (e) {
      setError(normalizeError(e).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={close} labelledBy="pagamento-title" className="max-w-[500px]">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Wallet className="size-5" aria-hidden />
        </span>
        <h2 id="pagamento-title" className="flex-1 text-lead font-bold text-ink">Registrar pagamento de sessão</h2>
        <button type="button" onClick={close} disabled={saving} aria-label="Fechar janela" className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-40">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-4 text-body text-muted">Informe o status de pagamento desta sessão.</p>

      <div className="mt-4 rounded-xl bg-brand-100/60 p-4">
        <p className="text-body font-bold text-ink">{pacienteNome}</p>
        <p className="mt-0.5 text-caption font-medium text-brand-700">
          {fmtDateBr(sessao.inicio)} · {fmtRange(sessao)} · {sessao.local}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
          <span className="text-caption text-muted">Valor da sessão</span>
          <span className="text-body font-bold text-ink">{formatBRL(sessao.valor)}</span>
        </div>
      </div>

      <p className="mt-5 mb-2 text-caption font-semibold text-ink">Status do pagamento *</p>
      <div role="radiogroup" aria-label="Status do pagamento" className="grid grid-cols-2 gap-3">
        {(Object.keys(STATUS_LABEL) as StatusPagamento[]).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            disabled={saving}
            onClick={() => setStatus(s)}
            className={cn(
              'flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-4 text-body font-medium transition disabled:cursor-not-allowed',
              status === s ? 'border-brand-700 bg-brand-100/60 text-brand-900' : 'border-line bg-white text-ink hover:bg-slate-50'
            )}
          >
            <span className={cn('flex size-4 items-center justify-center rounded-full border', status === s ? 'border-brand-700' : 'border-slate-400')}>
              {status === s && <span className="size-2 rounded-full bg-brand-700" />}
            </span>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {changed && !error && (
        <p className="mt-3 flex items-center gap-1.5 text-caption text-muted">
          <Info className="size-3.5" aria-hidden />
          Alteração não salva. De {STATUS_LABEL[sessao.status]} para {STATUS_LABEL[status]}. O status será atualizado ao salvar.
        </p>
      )}
      {error && (
        <Notice tone="error" className="mt-3">
          <p className="font-semibold">Não foi possível salvar o status</p>
          <p>{error}</p>
        </Notice>
      )}

      <div className="mt-5 flex justify-end gap-2.5 border-t border-line pt-4">
        <Button variant="outline" onClick={close} disabled={saving}>Cancelar</Button>
        <Button onClick={() => void save()} loading={saving} disabled={!changed}>Salvar status</Button>
      </div>
    </Modal>
  )
}
