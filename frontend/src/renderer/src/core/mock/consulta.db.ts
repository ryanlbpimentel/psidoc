// Constantes do back (ConsultaService): se mudarem lá, mudam aqui e em features/agenda/lib/time.ts.
export const DURACAO_SESSAO_MS = 60 * 60_000
export const EXTENSAO_SESSAO_MS = 10 * 60_000
export const ANTECEDENCIA_ALERTA_MS = 10 * 60_000

export interface DbConsulta {
  id_consulta: number
  id_psicologo: string // '*' = consulta de demonstração, visível para qualquer psicólogo
  id_paciente: string
  inicio: string
  fim: string
  local: string
}

const KEY = 'psidoc:mock:consultas'

// ═════════════════════════════════════════════════════════════════════════════
// DADOS DE DEMONSTRAÇÃO (sempre relativos a "hoje")
//   Hoje:    09:00 Bruno · 14:00 Ana · 16:00 Clarice
//   Amanhã:  09:00 Daniel · 11:00 Gabriela · 15:00 Eduardo (sem telefone)
//
// Para ver a SESSÃO em andamento: agende uma consulta com início = agora (ou até 59 min atrás).
// Para ver o ALERTA de fim: início 50 min atrás (faltam 10 min).
// Lembrete com falha: paciente cujo telefone termina em 1111 (Gabriela).
// Para voltar a estes dados: localStorage.clear() no Console e recarregar (Ctrl+R).
// ═════════════════════════════════════════════════════════════════════════════
const at = (daysFromNow: number, hhmm: string) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const demo = (id: number, id_paciente: string, day: number, hhmm: string, local: string): DbConsulta => {
  const inicio = at(day, hhmm)
  return { id_consulta: id, id_psicologo: '*', id_paciente, inicio, fim: new Date(new Date(inicio).getTime() + DURACAO_SESSAO_MS).toISOString(), local }
}

const SEED: DbConsulta[] = [
  demo(1, 'p-bruno', 0, '09:00', 'Consultório Centro'),
  demo(2, 'p-ana', 0, '14:00', 'Consultório Centro'),
  demo(3, 'p-clarice', 0, '16:00', 'Sala Ipanema'),
  demo(4, 'p-daniel', 1, '09:00', 'Consultório Centro'),
  demo(5, 'p-gabriela', 1, '11:00', 'Consultório Centro'),
  demo(6, 'p-eduardo', 1, '15:00', 'Online')
]

export function writeConsultas(list: DbConsulta[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function readConsultas(): DbConsulta[] {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as DbConsulta[]
    } catch {
      /* corrompido: recria abaixo */
    }
  }
  writeConsultas(SEED)
  return SEED
}
