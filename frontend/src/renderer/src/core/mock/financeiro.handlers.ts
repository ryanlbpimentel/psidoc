import { readConsultas, type DbConsulta } from './consulta.db'
import {
  readPacotes, readPacotesPaciente, readPagamentos, VALOR_SESSAO_PADRAO, writePacotes, writePagamentos,
  type DbPagamento, type StatusPagamento
} from './financeiro.db'
import { MockHttpError, requireRole, type MockRequest, type MockResult, type MockRoute } from './http'
import { readPatients } from './patients.db'

/**
 * Financeiro (US31–US35). O back ainda NÃO tem este módulo: estas rotas são a proposta de contrato.
 *   GET   /financeiro/pagamentos?id_paciente=      sessões do paciente com valor e status
 *   PATCH /financeiro/pagamentos/:id_consulta      { status_pagamento: 'PAGA' | 'PENDENTE' }
 *   GET   /financeiro/faturamento?mes=AAAA-MM      { mes, total, recebimentos[] }
 *   GET   /financeiro/pacotes                      pacotes cadastrados
 *   POST  /financeiro/pacotes                      { quantidade_sessoes, valor_total }
 *   GET   /financeiro/pacotes/paciente/:id         pacotes do paciente com as parcelas
 */
const owner = (req: MockRequest) => String(requireRole(req, 'PSICOLOGO').sub)
const mine = (c: DbConsulta, id: string) => c.id_psicologo === '*' || c.id_psicologo === id
const STATUS: StatusPagamento[] = ['PAGA', 'PENDENTE']

const pagamentoOf = (c: DbConsulta, all: DbPagamento[]): DbPagamento =>
  all.find((p) => p.id_consulta === c.id_consulta) ?? { id_consulta: c.id_consulta, valor: VALOR_SESSAO_PADRAO, status_pagamento: 'PENDENTE', pago_em: null }

const item = (c: DbConsulta, p: DbPagamento) => ({
  id_consulta: c.id_consulta, inicio: c.inicio, fim: c.fim, local: c.local,
  valor: p.valor, status_pagamento: p.status_pagamento, pago_em: p.pago_em
})

function listPagamentos(req: MockRequest): MockResult {
  const me = owner(req)
  const idPaciente = req.query.id_paciente
  if (!idPaciente) throw new MockHttpError(400, 'Informe o paciente.')
  const all = readPagamentos()
  const items = readConsultas()
    .filter((c) => mine(c, me) && c.id_paciente === idPaciente)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .map((c) => item(c, pagamentoOf(c, all)))
  return { status: 200, data: items }
}

function registrar(req: MockRequest, [id]: string[]): MockResult {
  const me = owner(req)
  const status = req.body?.status_pagamento as StatusPagamento
  if (!STATUS.includes(status)) throw new MockHttpError(400, 'Status inválido. Use PAGA ou PENDENTE.')
  const consulta = readConsultas().find((c) => String(c.id_consulta) === id && mine(c, me))
  if (!consulta) throw new MockHttpError(404, 'Consulta não encontrada.')

  const all = readPagamentos()
  const current = pagamentoOf(consulta, all)
  const next: DbPagamento = {
    ...current,
    status_pagamento: status,
    pago_em: status === 'PAGA' ? (current.pago_em ?? new Date().toISOString()) : null
  }
  writePagamentos([...all.filter((p) => p.id_consulta !== consulta.id_consulta), next])
  return { status: 200, data: item(consulta, next) }
}

function faturamento(req: MockRequest): MockResult {
  const me = owner(req)
  const mes = req.query.mes ?? ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new MockHttpError(400, 'Informe o mês no formato AAAA-MM.')
  const [y, m] = mes.split('-').map(Number)
  const from = new Date(y, m - 1, 1).getTime()
  const to = new Date(y, m, 1).getTime()

  const consultas = readConsultas().filter((c) => mine(c, me))
  const pacientes = readPatients()
  const recebimentos = readPagamentos()
    .filter((p) => p.status_pagamento === 'PAGA' && p.pago_em && new Date(p.pago_em).getTime() >= from && new Date(p.pago_em).getTime() < to)
    .flatMap((p) => {
      const c = consultas.find((x) => x.id_consulta === p.id_consulta)
      if (!c) return []
      return [{ id_consulta: c.id_consulta, pago_em: p.pago_em as string, valor: p.valor, paciente: { nome: pacientes.find((x) => x.id === c.id_paciente)?.nome ?? '—' } }]
    })
    .sort((a, b) => a.pago_em.localeCompare(b.pago_em))
  return { status: 200, data: { mes, total: recebimentos.reduce((s, r) => s + r.valor, 0), recebimentos } }
}

function listPacotes(req: MockRequest): MockResult {
  owner(req)
  return { status: 200, data: [...readPacotes()].sort((a, b) => a.quantidade_sessoes - b.quantidade_sessoes) }
}

function cadastrarPacote(req: MockRequest): MockResult {
  owner(req)
  const quantidade = Number(req.body?.quantidade_sessoes)
  const valor = Number(req.body?.valor_total)
  if (!Number.isInteger(quantidade) || quantidade <= 0) throw new MockHttpError(400, 'A quantidade de sessões deve ser um número inteiro maior que zero.')
  if (!Number.isFinite(valor) || valor <= 0) throw new MockHttpError(400, 'O valor do pacote deve ser maior que zero.')
  const all = readPacotes()
  const created = { id_pacote: Math.max(0, ...all.map((p) => p.id_pacote)) + 1, quantidade_sessoes: quantidade, valor_total: Math.round(valor * 100) / 100 }
  writePacotes([...all, created])
  return { status: 201, data: created }
}

function pacotesDoPaciente(req: MockRequest, [idPaciente]: string[]): MockResult {
  owner(req)
  if (!readPatients().some((p) => p.id === idPaciente)) throw new MockHttpError(404, 'Paciente não encontrado.')
  const pacotes = readPacotes()
  const items = readPacotesPaciente()
    .filter((a) => a.id_paciente === idPaciente)
    .flatMap((a) => {
      const pacote = pacotes.find((p) => p.id_pacote === a.id_pacote)
      return pacote ? [{ id_pacote_paciente: a.id_pacote_paciente, ...pacote, parcelas: a.parcelas }] : []
    })
  return { status: 200, data: items }
}

export const financeiroRoutes: MockRoute[] = [
  { method: 'GET', pattern: /^\/financeiro\/pagamentos$/, handler: listPagamentos },
  { method: 'PATCH', pattern: /^\/financeiro\/pagamentos\/([^/]+)$/, handler: registrar },
  { method: 'GET', pattern: /^\/financeiro\/faturamento$/, handler: faturamento },
  { method: 'GET', pattern: /^\/financeiro\/pacotes$/, handler: listPacotes },
  { method: 'POST', pattern: /^\/financeiro\/pacotes$/, handler: cadastrarPacote },
  { method: 'GET', pattern: /^\/financeiro\/pacotes\/paciente\/([^/]+)$/, handler: pacotesDoPaciente }
]
