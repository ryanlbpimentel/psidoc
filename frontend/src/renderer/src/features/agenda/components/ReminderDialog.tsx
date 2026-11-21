import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, Info, LoaderCircle, MessageCircle, TriangleAlert, User, X } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthContext'
import { normalizeError } from '@/core/http/errors'
import { patientsService } from '@/features/patients/services/patients.service'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { cn } from '@/shared/lib/cn'
import { buildReminderMessage, maskPhone } from '../lib/reminder'
import { fmtDateBr, fmtRange } from '../lib/time'
import { consultaService } from '../services/consulta.service'
import { CHANNEL_LABEL, type Consulta, type ReminderChannel } from '../types'

type Phase = 'loading' | 'ready' | 'sending' | 'sent' | 'failed' | 'no-phone'

const TITLE: Record<Phase, string> = {
  loading: 'Enviar lembrete',
  ready: 'Enviar lembrete',
  sending: 'Enviar lembrete',
  sent: 'Lembrete enviado',
  failed: 'Falha ao enviar lembrete',
  'no-phone': 'Telefone não cadastrado'
}

const via = (channel: ReminderChannel) => (channel === 'WHATSAPP' ? 'pelo WhatsApp' : 'por SMS')

interface ReminderDialogProps {
  consulta: Consulta | null
  onClose: () => void
}

export function ReminderDialog({ consulta, onClose }: ReminderDialogProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('loading')
  const [phone, setPhone] = useState<string | null>(null)
  const [channel, setChannel] = useState<ReminderChannel>('WHATSAPP')
  const [loadError, setLoadError] = useState(false)

  const loadPatient = useCallback(async (c: Consulta) => {
    setPhase('loading')
    setLoadError(false)
    try {
      // A lista de consultas só traz o nome; o telefone vem do cadastro do paciente.
      const patient = await patientsService.get(c.id_paciente)
      setPhone(patient.telefone ?? null)
      setPhase(patient.telefone ? 'ready' : 'no-phone')
    } catch {
      setLoadError(true)
      setPhase('failed')
    }
  }, [])

  useEffect(() => {
    if (!consulta) return
    setChannel('WHATSAPP')
    void loadPatient(consulta)
  }, [consulta, loadPatient])

  if (!consulta) return null

  const busy = phase === 'sending'
  const close = () => !busy && onClose()
  const message = buildReminderMessage(consulta, user?.name ?? '')
  const channelName = CHANNEL_LABEL[channel]

  const send = async () => {
    setPhase('sending')
    try {
      await consultaService.sendReminder(consulta.id, channel)
      setPhase('sent')
    } catch (error) {
      const err = normalizeError(error)
      // O cadastro mudou depois de abrir o diálogo: o back avisa que não há telefone.
      setPhase(err.status === 400 && /telefone/i.test(err.message) ? 'no-phone' : 'failed')
    }
  }

  const sent = phase === 'sent'
  return (
    <Modal open onClose={close} labelledBy="reminder-title" className="max-w-[500px]">
      <div className="flex items-center gap-3">
        <span className={cn('flex size-11 items-center justify-center rounded-xl', sent ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-100 text-brand-700')}>
          {sent ? <CircleCheck className="size-5" aria-hidden /> : <MessageCircle className="size-5" aria-hidden />}
        </span>
        <h2 id="reminder-title" className="flex-1 text-lead font-bold text-ink">{TITLE[phase]}</h2>
        <button type="button" onClick={close} disabled={busy} aria-label="Fechar janela" className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-40">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-4 text-body text-muted">
        {sent ? `A solicitação de envio ${via(channel)} foi concluída.` : 'Confira o destinatário e a mensagem antes de enviar.'}
      </p>

      {phase === 'loading' ? (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-brand-100/60 px-4 py-6 text-body text-muted" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden /> Carregando dados do paciente…
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl bg-brand-100/60 p-4">
            <p className="text-body font-bold text-ink">{consulta.paciente.nome}</p>
            <p className={cn('mt-0.5 text-caption', phase === 'no-phone' ? 'text-danger' : 'text-muted')}>
              {phase === 'no-phone' ? `${channelName} · telefone ausente no cadastro` : phone ? `${channelName} · ${maskPhone(phone)}` : channelName}
            </p>
            <p className="mt-3 border-t border-line pt-2.5 text-caption font-medium text-brand-700">
              {fmtDateBr(consulta.inicio)} · {fmtRange(consulta)} · {consulta.local}
            </p>
          </div>

          {(phase === 'ready' || phase === 'sending' || phase === 'failed') && !loadError && (
            <div role="radiogroup" aria-label="Canal de envio" className="mt-4 inline-flex rounded-xl border border-line bg-slate-50 p-1">
              {(Object.keys(CHANNEL_LABEL) as ReminderChannel[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={channel === c}
                  disabled={busy}
                  onClick={() => setChannel(c)}
                  className={cn('cursor-pointer rounded-lg px-3.5 py-1.5 text-caption font-semibold transition disabled:cursor-not-allowed', channel === c ? 'bg-white text-brand-700 shadow-sm' : 'text-muted hover:text-ink')}
                >
                  {CHANNEL_LABEL[c]}
                </button>
              ))}
            </div>
          )}

          {!loadError && (
            <div className="mt-4">
              <p className="mb-1.5 text-caption font-semibold text-ink">Prévia da mensagem</p>
              <p className="rounded-xl border border-line bg-slate-50 px-4 py-3.5 text-body leading-relaxed whitespace-pre-wrap text-ink">{message}</p>
            </div>
          )}

          <div className="mt-4">
            {(phase === 'ready' || phase === 'sending') && (
              <Notice tone="info" icon={Info} className="bg-brand-100/60 text-slate-600">
                <p className="font-semibold text-brand-900">Envio manual {via(channel)}</p>
                <p>A mensagem será enviada somente após sua confirmação.</p>
              </Notice>
            )}
            {phase === 'sent' && (
              <Notice tone="success">
                <p className="font-semibold">Lembrete enviado</p>
                <p>Isso não confirma que a mensagem foi entregue ou lida.</p>
              </Notice>
            )}
            {phase === 'failed' && (
              <Notice tone="error">
                <p className="font-semibold">{loadError ? 'Não foi possível carregar os dados do paciente' : 'Não foi possível enviar a mensagem'}</p>
                <p>{loadError ? 'Confira a conexão e tente novamente.' : 'A mensagem não foi enviada. Confira a conexão e tente novamente.'}</p>
              </Notice>
            )}
            {phase === 'no-phone' && (
              <Notice tone="warning" icon={TriangleAlert}>
                <p className="font-semibold">Envio indisponível sem telefone</p>
                <p>Consulte o cadastro do paciente para verificar o contato.</p>
              </Notice>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2.5 border-t border-line pt-4">
            {sent ? (
              <Button onClick={onClose}>Voltar à agenda</Button>
            ) : phase === 'no-phone' ? (
              <>
                <Button variant="outline" onClick={onClose}>Fechar</Button>
                <Button onClick={() => navigate(`/pacientes/${consulta.id_paciente}`)}>
                  <User className="size-4" aria-hidden /> Ver cadastro do paciente
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={close} disabled={busy}>Cancelar</Button>
                <Button loading={busy} onClick={() => (loadError ? void loadPatient(consulta) : void send())}>
                  {!busy && <MessageCircle className="size-4" aria-hidden />}
                  {busy ? 'Enviando…' : phase === 'failed' ? 'Tentar novamente' : channel === 'WHATSAPP' ? 'Enviar pelo WhatsApp' : 'Enviar por SMS'}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
