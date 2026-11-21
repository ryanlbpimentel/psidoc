import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, Clock, CloudOff, Plus, RefreshCw, TriangleAlert } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { DURACAO_PADRAO_MIN, durationMin, EXTENSAO_MIN, fmtTime, fmtWeekdayDate, isAlert, isExtended, remainingMs } from '@/features/agenda/lib/time'
import type { Sessao } from '@/features/agenda/types'
import { StateCard } from '@/shared/components/StateCard'
import { Button, buttonVariants } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { useNow } from '@/shared/hooks/useNow'
import { cn } from '@/shared/lib/cn'
import { CountdownRing } from '../components/CountdownRing'
import { ExtendDialog } from '../components/ExtendDialog'
import { useSessions } from '../SessionProvider'

interface ExtendError {
  detail: string
}

export function SessionPage() {
  const { sessions, loaded, failed, lastEnded, refresh, extend, dismissEnded } = useSessions()
  const now = useNow(1_000)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [extendError, setExtendError] = useState<ExtendError | null>(null)

  // Ao sair da tela, esquece o aviso de "sessão encerrada".
  useEffect(() => () => dismissEnded(), [dismissEnded])

  const session = sessions.find((s) => s.id === selectedId) ?? sessions[0] ?? null

  const handleConfirm = async () => {
    if (!session) return
    try {
      await extend(session.id)
      setExtendError(null)
    } catch (error) {
      const err = normalizeError(error)
      // 400 = a consulta já foi estendida ou já terminou: tentar de novo não resolve, então atualizamos a tela.
      if (err.status === 400) void refresh()
      setExtendError({
        detail: err.status === 400 ? err.message : `O término continua às ${fmtTime(session.fim)}. O acréscimo não foi utilizado; tente novamente.`
      })
    } finally {
      setConfirming(false)
    }
  }

  let body
  if (!loaded) {
    body = <div aria-busy="true" aria-label="Carregando sessão" className="h-[360px] animate-pulse rounded-2xl border border-line bg-slate-100/70" />
  } else if (!session && lastEnded) {
    body = (
      <StateCard icon={Clock} title="Sessão encerrada" actions={<AgendaLink primary />}>
        {`A sessão com ${lastEnded.paciente.nome} terminou às ${fmtTime(lastEnded.fim)}.`}
      </StateCard>
    )
  } else if (!session && failed) {
    body = (
      <StateCard icon={CloudOff} tone="danger" title="Não foi possível carregar a sessão"
        actions={<Button onClick={() => void refresh()}><RefreshCw className="size-4" aria-hidden /> Tentar novamente</Button>}>
        Não conseguimos consultar a sessão agora. Tente novamente.
      </StateCard>
    )
  } else if (!session) {
    body = (
      <StateCard icon={Clock} title="Nenhuma sessão em andamento" actions={<AgendaLink primary label="Ver agenda" />}>
        {'Não há consulta acontecendo neste momento.\nConsulte os próximos horários na sua agenda.'}
      </StateCard>
    )
  } else {
    body = (
      <ActiveSession
        session={session}
        all={sessions}
        now={now}
        extendError={extendError}
        onSelect={(id) => { setSelectedId(id); setExtendError(null) }}
        onExtend={() => setConfirming(true)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-ink">Sessão</h1>
          <p className="mt-0.5 text-body text-muted">Acompanhe o tempo da consulta em andamento.</p>
        </div>
        <AgendaLink />
      </div>
      <div className="mt-6">{body}</div>
      <ExtendDialog session={confirming ? session : null} onCancel={() => setConfirming(false)} onConfirm={handleConfirm} />
    </div>
  )
}

function AgendaLink({ primary, label = 'Voltar à agenda' }: { primary?: boolean; label?: string }) {
  return (
    <Link to="/agenda" className={cn(buttonVariants({ variant: primary ? 'primary' : 'outline' }))}>
      {primary ? <CalendarDays className="size-4" aria-hidden /> : <ArrowLeft className="size-4" aria-hidden />} {label}
    </Link>
  )
}

interface ActiveSessionProps {
  session: Sessao
  all: Sessao[]
  now: number
  extendError: ExtendError | null
  onSelect: (id: string) => void
  onExtend: () => void
}

function ActiveSession({ session, all, now, extendError, onSelect, onExtend }: ActiveSessionProps) {
  const remaining = remainingMs(session, now)
  const alert = isAlert(session, now)
  const extended = isExtended(session)
  const duration = durationMin(session)
  const added = duration - DURACAO_PADRAO_MIN
  const minutesLeft = Math.max(1, Math.ceil(remaining / 60_000))

  return (
    <div className="space-y-5">
      {all.length > 1 && (
        <div role="radiogroup" aria-label="Sessões em andamento" className="flex flex-wrap gap-2">
          {all.map((s) => (
            <button
              key={s.id} type="button" role="radio" aria-checked={s.id === session.id} onClick={() => onSelect(s.id)}
              className={cn('cursor-pointer rounded-xl border px-3.5 py-2 text-caption font-semibold transition', s.id === session.id ? 'border-brand-700 bg-brand-100 text-brand-700' : 'border-line bg-surface text-muted hover:text-ink')}
            >
              {s.paciente.nome} · até {fmtTime(s.fim)}
            </button>
          ))}
        </div>
      )}

      <section className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lead font-bold text-brand-700">{session.paciente.nome[0]?.toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lead font-bold text-ink">{session.paciente.nome}</h2>
          <p className="text-caption text-muted">{fmtWeekdayDate(session.inicio)} · {session.local}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-caption font-medium text-emerald-700">Em andamento</span>
      </section>

      {alert ? (
        <Notice tone="warning" icon={TriangleAlert}>
          <p className="font-semibold">A sessão termina em {minutesLeft} {minutesLeft === 1 ? 'minuto' : 'minutos'}</p>
          <p>{session.paciente.nome} · término previsto às {fmtTime(session.fim)}. Acompanhe o tempo restante.</p>
        </Notice>
      ) : extended ? (
        <Notice tone="success">
          <p className="font-semibold">Sessão estendida em {added} minutos</p>
          <p>Novo término: {fmtTime(session.fim)}. O acréscimo disponível para esta sessão já foi utilizado.</p>
        </Notice>
      ) : (
        <Notice tone="info" className="bg-brand-100/60 text-slate-600">
          <p className="font-semibold text-brand-900">Sessão em andamento</p>
          <p>{session.paciente.nome} · término previsto às {fmtTime(session.fim)}.</p>
        </Notice>
      )}

      <div className="grid gap-5 md:grid-cols-[1fr_300px]">
        <section className="flex flex-col items-center rounded-2xl border border-line bg-surface p-6">
          <p className="text-caption text-muted">Horário atual: {fmtTime(now)}</p>
          <div className="mt-4">
            <CountdownRing remainingMs={remaining} totalMs={new Date(session.fim).getTime() - new Date(session.inicio).getTime()} alert={alert} />
          </div>
          <p className="mt-6 text-lead font-bold text-ink">{fmtTime(session.inicio)} — {fmtTime(session.fim)}</p>
          <p className="mt-1 text-caption text-muted">
            {extended ? `${duration} minutos no total · ${added} minutos acrescentados` : `${duration} minutos previstos para esta consulta`}
          </p>
          {extendError && (
            <Notice tone="error" className="mt-5 w-full">
              <p className="font-semibold">Não foi possível estender a sessão</p>
              <p>{extendError.detail}</p>
            </Notice>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-body font-bold text-ink">Detalhes da sessão</h2>
          <dl className="mt-4 space-y-3.5 text-caption">
            {[
              ['Início', fmtTime(session.inicio)],
              ['Término previsto', fmtTime(session.fim)],
              ['Duração inicial', `${DURACAO_PADRAO_MIN} minutos`],
              ['Duração total', `${duration} minutos`]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted">{label}</dt>
                <dd className="font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-caption text-muted">{extended ? `Acréscimo de ${EXTENSAO_MIN} minutos já utilizado.` : 'Disponível uma vez por sessão'}</p>
            {extended ? (
              <Button variant="outline" disabled className="mt-3 w-full">
                <Check className="size-4" aria-hidden /> Extensão já utilizada
              </Button>
            ) : (
              <Button onClick={onExtend} disabled={remaining <= 0} className="mt-3 w-full">
                <Plus className="size-4" aria-hidden /> {extendError ? `Tentar estender +${EXTENSAO_MIN} min` : `Estender +${EXTENSAO_MIN} min`}
              </Button>
            )}
            <p className="mt-2.5 text-caption text-muted">{extended ? 'Não é possível estender novamente esta sessão.' : 'O acréscimo altera o término previsto da consulta.'}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
