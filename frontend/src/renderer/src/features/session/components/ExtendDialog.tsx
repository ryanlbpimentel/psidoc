import { useState } from 'react'
import { ClockPlus, Info, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { addMinutesIso, durationMin, EXTENSAO_MIN, fmtDateBr, fmtTime } from '@/features/agenda/lib/time'
import type { Sessao } from '@/features/agenda/types'

interface ExtendDialogProps {
  session: Sessao | null
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function ExtendDialog({ session, onCancel, onConfirm }: ExtendDialogProps) {
  const [busy, setBusy] = useState(false)
  if (!session) return null

  const duration = durationMin(session)
  const cancel = () => !busy && onCancel()
  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={cancel} labelledBy="extend-title" className="max-w-[460px]">
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <ClockPlus className="size-5" aria-hidden />
      </span>
      <h2 id="extend-title" className="mt-4 text-lead font-bold text-ink">Estender esta sessão em {EXTENSAO_MIN} minutos?</h2>
      <p className="mt-1.5 text-body text-muted">{session.paciente.nome} · {fmtDateBr(session.inicio)} · {session.local}</p>

      <dl className="mt-5 rounded-xl border border-line bg-slate-50 p-4 text-body">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <dt className="text-muted">Duração total</dt>
          <dd className="font-bold text-brand-700">{duration} → {duration + EXTENSAO_MIN} minutos</dd>
        </div>
        <div className="flex items-center justify-between pt-3">
          <dt className="text-muted">Término previsto</dt>
          <dd className="font-bold text-brand-700">{fmtTime(session.fim)} → {fmtTime(addMinutesIso(session.fim, EXTENSAO_MIN))}</dd>
        </div>
        <p className="mt-1.5 text-caption text-muted">O início da consulta permanece às {fmtTime(session.inicio)}.</p>
      </dl>

      <Notice tone="info" icon={Info} className="mt-4 bg-brand-100/60 text-slate-600">
        <p className="font-semibold text-brand-900">Disponível uma vez por sessão</p>
        <p>Após confirmar, não será possível acrescentar outros {EXTENSAO_MIN} minutos nesta sessão.</p>
      </Notice>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" onClick={cancel} disabled={busy}>Cancelar</Button>
        <Button loading={busy} onClick={() => void confirm()}>
          {!busy && <Plus className="size-4" aria-hidden />} Estender +{EXTENSAO_MIN} min
        </Button>
      </div>
    </Modal>
  )
}
