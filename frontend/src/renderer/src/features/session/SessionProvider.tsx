import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { consultaService } from '@/features/agenda/services/consulta.service'
import type { Sessao } from '@/features/agenda/types'

const POLL_MS = 30_000

interface SessionContextValue {
  /** Consultas acontecendo agora (normalmente 0 ou 1; pode haver 2 se uma extensão invadir a próxima consulta). */
  sessions: Sessao[]
  loaded: boolean
  failed: boolean
  /** Última sessão que acabou de terminar (o back deixa de listá-la ao passar do horário). */
  lastEnded: Sessao | null
  refresh: () => Promise<void>
  extend: (id: string) => Promise<void>
  dismissEnded: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

/** Mantém a sessão em andamento atualizada em qualquer tela (consulta o back a cada 30 s e ao voltar para a janela). */
export function SessionProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [sessions, setSessions] = useState<Sessao[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [lastEnded, setLastEnded] = useState<Sessao | null>(null)
  const previous = useRef<Sessao[]>([])

  const refresh = useCallback(async () => {
    try {
      const next = await consultaService.ongoing()
      const ids = new Set(next.map((s) => s.id))
      const ended = previous.current.find((s) => !ids.has(s.id) && new Date(s.fim).getTime() <= Date.now() + 60_000)
      if (ended) setLastEnded(ended)
      previous.current = next
      setSessions(next)
      setFailed(false)
    } catch {
      setFailed(true) // mantém o último estado conhecido; a próxima rodada tenta de novo
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const id = setInterval(() => void refresh(), POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && void refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [enabled, refresh])

  // Ao chegar a hora de terminar, confirma com o back em vez de esperar a próxima rodada.
  useEffect(() => {
    if (!enabled || sessions.length === 0) return
    const soonest = Math.min(...sessions.map((s) => new Date(s.fim).getTime()))
    const timeout = setTimeout(() => void refresh(), Math.max(1_000, soonest - Date.now() + 1_500))
    return () => clearTimeout(timeout)
  }, [enabled, sessions, refresh])

  const extend = useCallback(
    async (id: string) => {
      await consultaService.extend(id)
      await refresh()
    },
    [refresh]
  )
  const dismissEnded = useCallback(() => setLastEnded(null), [])

  const value = useMemo(
    () => ({ sessions, loaded, failed, lastEnded, refresh, extend, dismissEnded }),
    [sessions, loaded, failed, lastEnded, refresh, extend, dismissEnded]
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessions() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessions deve ser usado dentro de <SessionProvider>')
  return ctx
}
