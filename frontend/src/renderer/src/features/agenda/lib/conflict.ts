import { consultaService } from '../services/consulta.service'
import { addMinutesIso, DURACAO_PADRAO_MIN, endOfDayIso, firstNames, fmtRange, startOfDayIso, toYmd } from './time'

export interface ConflictInfo {
  title: string
  detail: string
}

/** O back só diz "já existe uma consulta neste horário"; aqui descobrimos com quem (olhando a agenda do dia). */
export async function describeConflict(inicio: string, fallback: string): Promise<ConflictInfo> {
  const title = 'Não foi possível agendar: conflito de horário'
  try {
    const start = new Date(inicio).getTime()
    const end = start + DURACAO_PADRAO_MIN * 60_000
    const day = toYmd(new Date(inicio))
    const sameDay = await consultaService.list({ from: startOfDayIso(day), to: endOfDayIso(day) })
    const other = sameDay.find((c) => new Date(c.inicio).getTime() < end && new Date(c.fim).getTime() > start)
    if (!other) return { title, detail: fallback }
    const mine = fmtRange({ inicio, fim: addMinutesIso(inicio, DURACAO_PADRAO_MIN) })
    const date = new Date(inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    return { title, detail: `${date}, ${mine} sobrepõe ${firstNames(other.paciente.nome)}, ${fmtRange(other)}. Ajuste a data ou a hora de início e tente novamente.` }
  } catch {
    return { title, detail: fallback }
  }
}
