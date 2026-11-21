import { ANTECEDENCIA_ALERTA_MS, DURACAO_SESSAO_MS, EXTENSAO_SESSAO_MS, readConsultas, writeConsultas, type DbConsulta } from './consulta.db'
import { MockHttpError, requireRole, type MockRequest, type MockResult, type MockRoute } from './http'
import { readPatients } from './patients.db'

/**
 * Espelha backend/src/modules/consulta (ConsultaController/ConsultaService):
 * mesmas rotas, mesmos corpos, mesmos códigos e mensagens de erro.
 */
const owner = (req: MockRequest) => String(requireRole(req, 'PSICOLOGO').sub)
const mine = (c: DbConsulta, id: string) => c.id_psicologo === '*' || c.id_psicologo === id
const ms = (iso: string) => new Date(iso).getTime()

const patientOf = (c: DbConsulta) => readPatients().find((p) => p.id === c.id_paciente)
const withPatient = (c: DbConsulta) => ({ ...c, paciente: { nome: patientOf(c)?.nome ?? '—' } })
const plain = ({ id_consulta, id_psicologo, id_paciente, inicio, fim, local }: DbConsulta) => ({ id_consulta, id_psicologo, id_paciente, inicio, fim, local })

function findMine(req: MockRequest, rawId: string) {
  const me = owner(req)
  const found = readConsultas().find((c) => String(c.id_consulta) === rawId && mine(c, me))
  if (!found) throw new MockHttpError(404, 'Consulta não encontrada.')
  return found
}

function schedule(req: MockRequest): MockResult {
  const me = owner(req)
  const { id_paciente, inicio, local } = req.body ?? {}
  if (id_paciente === undefined || id_paciente === null || id_paciente === '') throw new MockHttpError(400, 'O paciente da consulta é obrigatório')
  if (!inicio || Number.isNaN(Date.parse(inicio)) || !/T\d{2}:\d{2}/.test(String(inicio))) throw new MockHttpError(400, 'O horário de início é obrigatório')
  if (!local || !String(local).trim()) throw new MockHttpError(400, 'O local da consulta é obrigatório')
  if (String(local).length > 255) throw new MockHttpError(400, 'O local deve ter no máximo 255 caracteres')
  if (!readPatients().some((p) => p.id === String(id_paciente))) throw new MockHttpError(404, 'Paciente não encontrado.')

  const start = ms(inicio)
  const end = start + DURACAO_SESSAO_MS
  const all = readConsultas()
  if (all.some((c) => mine(c, me) && ms(c.inicio) < end && ms(c.fim) > start))
    throw new MockHttpError(409, 'Já existe uma consulta agendada neste horário.')

  const created: DbConsulta = {
    id_consulta: Math.max(0, ...all.map((c) => c.id_consulta)) + 1,
    id_psicologo: me, id_paciente: String(id_paciente), inicio: new Date(start).toISOString(),
    fim: new Date(end).toISOString(), local: String(local).trim()
  }
  writeConsultas([...all, created])
  return { status: 201, data: plain(created) }
}

function list(req: MockRequest): MockResult {
  const me = owner(req)
  const from = req.query.data_inicio ? ms(req.query.data_inicio) : -Infinity
  const to = req.query.data_fim ? ms(req.query.data_fim) : Infinity
  const items = readConsultas()
    .filter((c) => mine(c, me) && ms(c.inicio) >= from && ms(c.inicio) <= to)
    .sort((a, b) => ms(a.inicio) - ms(b.inicio))
    .map(withPatient)
  return { status: 200, data: items }
}

function ongoing(req: MockRequest): MockResult {
  const me = owner(req)
  const now = Date.now()
  const items = readConsultas()
    .filter((c) => mine(c, me) && ms(c.inicio) <= now && ms(c.fim) >= now)
    .sort((a, b) => ms(a.fim) - ms(b.fim))
    .map((c) => {
      const left = ms(c.fim) - now
      return { ...withPatient(c), minutos_restantes: Math.ceil(left / 60_000), alertar: left <= ANTECEDENCIA_ALERTA_MS }
    })
  return { status: 200, data: items }
}

function extend(req: MockRequest, [id]: string[]): MockResult {
  const target = findMine(req, id)
  const now = Date.now()
  if (now < ms(target.inicio) || now > ms(target.fim)) throw new MockHttpError(400, 'A consulta não está em andamento.')
  if (ms(target.fim) - ms(target.inicio) > DURACAO_SESSAO_MS) throw new MockHttpError(400, 'A consulta já foi estendida.')
  const all = readConsultas()
  const stored = all.find((c) => c.id_consulta === target.id_consulta) as DbConsulta
  stored.fim = new Date(ms(stored.fim) + EXTENSAO_SESSAO_MS).toISOString()
  writeConsultas(all)
  return { status: 200, data: plain(stored) }
}

function reminder(req: MockRequest, [id]: string[]): MockResult {
  const target = findMine(req, id)
  const canal = req.body?.canal
  if (canal !== 'WHATSAPP' && canal !== 'SMS') throw new MockHttpError(400, 'Canal inválido. Use WHATSAPP ou SMS.')
  const phone = patientOf(target)?.telefone
  if (!phone) throw new MockHttpError(400, 'O paciente não possui telefone cadastrado.')
  // Regra do mock para ver a tela de falha: telefone terminado em 1111 "não é entregue à operadora".
  if (phone.endsWith('1111')) throw new MockHttpError(502, 'Não foi possível enviar o lembrete.')
  return { status: 200, data: { sucesso: true, id_consulta: target.id_consulta, canal } }
}

export const consultaRoutes: MockRoute[] = [
  { method: 'POST', pattern: /^\/consulta\/agendar$/, handler: schedule },
  { method: 'GET', pattern: /^\/consulta$/, handler: list },
  { method: 'GET', pattern: /^\/consulta\/em-andamento$/, handler: ongoing },
  { method: 'PATCH', pattern: /^\/consulta\/([^/]+)\/estender$/, handler: extend },
  { method: 'POST', pattern: /^\/consulta\/([^/]+)\/lembrete$/, handler: reminder }
]
