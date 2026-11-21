import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { fmtTime, isAlert, remainingMs } from '@/features/agenda/lib/time'
import type { Sessao } from '@/features/agenda/types'
import { useNow } from '@/shared/hooks/useNow'
import { useSessions } from '../SessionProvider'

function notifyDesktop(session: Sessao) {
  try {
    if (typeof Notification === 'undefined') return
    const show = () =>
      new Notification('A sessão está terminando', { body: `${session.paciente.nome} · término previsto às ${fmtTime(session.fim)}` })
    if (Notification.permission === 'granted') show()
    else if (Notification.permission !== 'denied') void Notification.requestPermission().then((p) => p === 'granted' && show())
  } catch {
    /* notificação do sistema é um extra: o aviso na tela continua valendo */
  }
}

/** Alerta de fim de sessão (US30) em qualquer tela: faixa no topo + notificação do sistema, uma vez por sessão. */
export function SessionAlertWatcher() {
  const { sessions } = useSessions()
  const { pathname } = useLocation()
  const now = useNow(10_000)
  const notified = useRef(new Set<string>())

  const alerting = sessions.filter((s) => isAlert(s, now) && remainingMs(s, now) > 0)
  const key = alerting.map((s) => `${s.id}:${s.fim}`).join('|')

  useEffect(() => {
    for (const s of alerting) {
      const id = `${s.id}:${s.fim}`
      if (notified.current.has(id)) continue
      notified.current.add(id)
      notifyDesktop(s)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` resume o conteúdo de `alerting`
  }, [key])

  const first = alerting[0]
  if (!first || pathname.startsWith('/sessao')) return null
  const minutes = Math.max(1, Math.ceil(remainingMs(first, now) / 60_000))

  return (
    <div role="alert" className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-8 py-2.5 text-body text-amber-900">
      <TriangleAlert className="size-4 shrink-0" aria-hidden />
      <p className="flex-1">
        <span className="font-semibold">A sessão com {first.paciente.nome} termina em {minutes} {minutes === 1 ? 'minuto' : 'minutos'}.</span>{' '}
        Término previsto às {fmtTime(first.fim)}.
      </p>
      <Link to="/sessao" className="flex shrink-0 items-center gap-1 font-semibold hover:underline">
        Ver sessão <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  )
}
