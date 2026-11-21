import type { Consulta } from '../types'

// Mesmas regras do back (ConsultaService). Se o back mudar, mude aqui.
export const DURACAO_PADRAO_MIN = 60
export const EXTENSAO_MIN = 10
export const ALERTA_MIN = 10
const MIN = 60_000

const pad = (n: number) => String(n).padStart(2, '0')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Date → "AAAA-MM-DD" no fuso local (valor dos campos de data). */
export const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromYmd = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (ymd: string, days: number) => {
  const d = fromYmd(ymd)
  d.setDate(d.getDate() + days)
  return toYmd(d)
}
export const todayYmd = () => toYmd(new Date())

/** Início e fim do dia local como ISO (o back filtra com data_inicio/data_fim). */
export const startOfDayIso = (ymd: string) => fromYmd(ymd).toISOString()
export const endOfDayIso = (ymd: string) => {
  const d = fromYmd(ymd)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

/** Data + hora do formulário → ISO enviado ao back (campo `inicio`). */
export function combineToIso(ymd: string, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = fromYmd(ymd)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const fmtTime = (iso: string | number) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
export const fmtRange = (c: Pick<Consulta, 'inicio' | 'fim'>) => `${fmtTime(c.inicio)}–${fmtTime(c.fim)}`
export const fmtDateBr = (iso: string | number | Date) => new Date(iso).toLocaleDateString('pt-BR')
export const fmtYmdBr = (ymd: string) => fmtDateBr(fromYmd(ymd))
export const fmtDayHeader = (ymd: string) =>
  cap(fromYmd(ymd).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))
export const fmtWeekdayDate = (iso: string) =>
  `${cap(new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long' }))}, ${fmtDateBr(iso)}`

export const dayKey = (iso: string) => toYmd(new Date(iso))
export const addMinutesIso = (iso: string, minutes: number) => new Date(new Date(iso).getTime() + minutes * MIN).toISOString()

export const durationMin = (c: Pick<Consulta, 'inicio' | 'fim'>) => Math.round((new Date(c.fim).getTime() - new Date(c.inicio).getTime()) / MIN)
/** O back só aceita uma extensão: depois dela a duração passa de 60 min. */
export const isExtended = (c: Pick<Consulta, 'inicio' | 'fim'>) => durationMin(c) > DURACAO_PADRAO_MIN
export const remainingMs = (c: Pick<Consulta, 'fim'>, now: number) => new Date(c.fim).getTime() - now
export const isOngoing = (c: Pick<Consulta, 'inicio' | 'fim'>, now: number) =>
  new Date(c.inicio).getTime() <= now && now <= new Date(c.fim).getTime()
/** Mesma regra do campo `alertar` do back: faltam 10 minutos ou menos. */
export const isAlert = (c: Pick<Consulta, 'fim'>, now: number) => remainingMs(c, now) <= ALERTA_MIN * MIN

export function fmtCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

/** "29 a 30 de outubro de 2026" · "29 de outubro de 2026" · "29 de outubro a 2 de novembro de 2026". */
export function fmtPeriod(from: string, to: string) {
  const a = fromYmd(from)
  const b = fromYmd(to)
  const month = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'long' })
  if (from === to) return `${a.getDate()} de ${month(a)} de ${a.getFullYear()}`
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()} a ${b.getDate()} de ${month(b)} de ${b.getFullYear()}`
  return `${a.getDate()} de ${month(a)} a ${b.getDate()} de ${month(b)} de ${b.getFullYear()}`
}

export const firstNames = (name: string, count = 2) => name.trim().split(/\s+/).slice(0, count).join(' ')

export function groupByDay(items: Consulta[]) {
  const groups: { key: string; items: Consulta[] }[] = []
  for (const item of items) {
    const key = dayKey(item.inicio)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(item)
    else groups.push({ key, items: [item] })
  }
  return groups
}
