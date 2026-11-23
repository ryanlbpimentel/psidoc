import { DURACAO_SESSAO_MS, readConsultas, writeConsultas, type DbConsulta } from './consulta.db'

export type StatusPagamento = 'PAGA' | 'PENDENTE'

/** Pagamento de uma consulta (US31). Consulta sem registro = pendente com o valor padrão. */
export interface DbPagamento {
  id_consulta: number
  valor: number
  status_pagamento: StatusPagamento
  pago_em: string | null
}

export interface DbPacote {
  id_pacote: number
  quantidade_sessoes: number
  valor_total: number
}

export interface DbParcela {
  numero: number
  vencimento: string // AAAA-MM-DD
  valor: number
  status: StatusPagamento
}

/** Pacote atribuído a um paciente, com as parcelas (US35). Não há tela para atribuir: só dados de demonstração. */
export interface DbPacotePaciente {
  id_pacote_paciente: number
  id_paciente: string
  id_pacote: number
  parcelas: DbParcela[]
}

export const VALOR_SESSAO_PADRAO = 200

const KEY = { pagamentos: 'psidoc:mock:pagamentos', pacotes: 'psidoc:mock:pacotes', atribuidos: 'psidoc:mock:pacotes-paciente' }

// ═════════════════════════════════════════════════════════════════════════════
// DADOS DE DEMONSTRAÇÃO (relativos a "hoje")
//   Sessões passadas (ids 101+) entram na agenda do mock: Ana tem 4 (3 pagas), Bruno, Clarice e Daniel 1 paga cada.
//   Pacotes: 4 sessões R$ 800 e 8 sessões R$ 1.600. Ana tem o de 4 sessões em 2 parcelas (1 paga).
//   Para voltar a estes dados: localStorage.clear() no Console e recarregar (Ctrl+R).
// ═════════════════════════════════════════════════════════════════════════════
const at = (daysFromNow: number, hhmm: string) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const ymd = (monthsFromNow: number) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + monthsFromNow)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const PAST: { id: number; paciente: string; dias: number; valor: number; paga: boolean }[] = [
  { id: 101, paciente: 'p-ana', dias: -28, valor: 200, paga: true },
  { id: 102, paciente: 'p-ana', dias: -21, valor: 200, paga: true },
  { id: 103, paciente: 'p-ana', dias: -14, valor: 200, paga: true },
  { id: 104, paciente: 'p-ana', dias: -7, valor: 200, paga: false },
  { id: 105, paciente: 'p-bruno', dias: -6, valor: 220, paga: true },
  { id: 106, paciente: 'p-clarice', dias: -5, valor: 180, paga: true },
  { id: 107, paciente: 'p-daniel', dias: -3, valor: 200, paga: true }
]

function seed() {
  const consultas = readConsultas()
  const extra: DbConsulta[] = PAST.filter((p) => !consultas.some((c) => c.id_consulta === p.id)).map((p) => {
    const inicio = at(p.dias, '14:00')
    return {
      id_consulta: p.id, id_psicologo: '*', id_paciente: p.paciente, inicio,
      fim: new Date(new Date(inicio).getTime() + DURACAO_SESSAO_MS).toISOString(), local: 'Consultório Centro'
    }
  })
  if (extra.length) writeConsultas([...consultas, ...extra])

  const pagamentos: DbPagamento[] = PAST.map((p) => ({
    id_consulta: p.id, valor: p.valor, status_pagamento: p.paga ? 'PAGA' : 'PENDENTE', pago_em: p.paga ? at(p.dias, '15:00') : null
  }))
  const pacotes: DbPacote[] = [
    { id_pacote: 1, quantidade_sessoes: 4, valor_total: 800 },
    { id_pacote: 2, quantidade_sessoes: 8, valor_total: 1600 }
  ]
  const atribuidos: DbPacotePaciente[] = [
    {
      id_pacote_paciente: 1, id_paciente: 'p-ana', id_pacote: 1,
      parcelas: [
        { numero: 1, vencimento: ymd(-1), valor: 400, status: 'PAGA' },
        { numero: 2, vencimento: ymd(0), valor: 400, status: 'PENDENTE' }
      ]
    }
  ]
  write('pagamentos', pagamentos)
  write('pacotes', pacotes)
  write('atribuidos', atribuidos)
}

function write(key: keyof typeof KEY, value: unknown) {
  localStorage.setItem(KEY[key], JSON.stringify(value))
}

function read<T>(key: keyof typeof KEY): T {
  if (!localStorage.getItem(KEY.pagamentos)) seed()
  try {
    return JSON.parse(localStorage.getItem(KEY[key]) ?? '[]') as T
  } catch {
    seed()
    return JSON.parse(localStorage.getItem(KEY[key]) ?? '[]') as T
  }
}

export const readPagamentos = () => read<DbPagamento[]>('pagamentos')
export const writePagamentos = (list: DbPagamento[]) => write('pagamentos', list)
export const readPacotes = () => read<DbPacote[]>('pacotes')
export const writePacotes = (list: DbPacote[]) => write('pacotes', list)
export const readPacotesPaciente = () => read<DbPacotePaciente[]>('atribuidos')
