import { onlyDigits } from '@/shared/lib/masks'
import type { Address, Guardian, Patient, PatientStatus } from '@/features/patients/types'
import { readUsers } from './db'
import { MockHttpError, requireRole, type MockRequest, type MockResult, type MockRoute } from './http'
import { readPatients, writePatients, type DbPatient } from './patients.db'

// Regras de validação espelham os DTOs do back (class-validator).
const GENDERS = ['MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO']
const KINSHIPS = ['PAI', 'MAE', 'PADRASTO', 'MADRASTA', 'AVOS', 'IRMAOS', 'TUTOR_LEGAL', 'OUTRO']
const STATUSES: PatientStatus[] = ['ATIVO', 'ARQUIVADO', 'FINALIZADO']
const MAX_GUARDIANS = 3

const isIsoDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const isBlank = (v: unknown) => typeof v !== 'string' || !v.trim()
const fold = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Tira os dados que no back são consultas separadas (endereço, responsáveis e registros). */
const toPatient = (p: DbPatient): Patient => {
  const patient: Partial<DbPatient> = { ...p }
  delete patient.endereco
  delete patient.responsaveis
  delete patient.registros
  return patient as Patient
}

function findPatient(all: DbPatient[], id: string) {
  const patient = all.find((p) => p.id === id)
  if (!patient) throw new MockHttpError(404, 'Paciente não encontrado.', 'PATIENT_NOT_FOUND')
  return patient
}

function assertEditable(p: DbPatient) {
  if (p.status !== 'ATIVO')
    throw new MockHttpError(409, 'Paciente arquivado não pode ser alterado.', 'PATIENT_ARCHIVED')
}

function fail(errors: Record<string, string>) {
  if (Object.keys(errors).length)
    throw new MockHttpError(422, 'Erro de validação. Revise os campos informados.', 'VALIDATION_ERROR', errors)
}

// ── Pacientes ────────────────────────────────────────────────────────────────
function validatePatient(body: Record<string, unknown>, partial: boolean) {
  const e: Record<string, string> = {}
  if ('nome' in body ? isBlank(body.nome) : !partial) e.nome = 'O nome do paciente é obrigatório'
  if ('data_nascimento' in body ? !isIsoDate(body.data_nascimento) : !partial)
    e.data_nascimento = 'Informe uma data de nascimento válida no formato AAAA-MM-DD'
  const optional = (key: string, ok: (v: unknown) => boolean, msg: string) => {
    if (body[key] !== undefined && body[key] !== null && !ok(body[key])) e[key] = msg
  }
  optional('telefone', (v) => typeof v === 'string' && /^\d{10,11}$/.test(v), 'O telefone deve conter DDD e 8 ou 9 dígitos')
  optional('cpf', (v) => typeof v === 'string' && /^\d{11}$/.test(v), 'O CPF do paciente deve conter 11 dígitos numéricos')
  optional('genero', (v) => GENDERS.includes(String(v)), 'Gênero informado é inválido')
  optional('renda_familiar', (v) => typeof v === 'number' && v >= 0, 'A renda familiar não pode ser negativa')
  optional('status', (v) => STATUSES.includes(v as PatientStatus), 'Status de paciente inválido')
  optional('observacoes', (v) => typeof v === 'string' && v.length <= 5000, 'As observações devem ter no máximo 5000 caracteres')
  fail(e)
}

function listPatients(req: MockRequest): MockResult {
  requireRole(req, 'PSICOLOGO')
  const status = (req.query.status ?? 'ATIVO') as PatientStatus
  const busca = fold(req.query.busca ?? '').trim()
  const buscaDigits = onlyDigits(busca)
  const page = Math.max(1, Number(req.query.page ?? 1))
  const pageSize = Math.max(1, Number(req.query.pageSize ?? 6))

  const all = readPatients()
  const filtered = all
    .filter((p) => p.status === status)
    .filter((p) => !busca || fold(p.nome).includes(busca) || (buscaDigits.length > 0 && (p.cpf ?? '').includes(buscaDigits)))
    .sort((a, b) =>
      status === 'ARQUIVADO'
        ? String(b.arquivado_em ?? '').localeCompare(String(a.arquivado_em ?? '')) // mais recentes primeiro
        : a.nome.localeCompare(b.nome, 'pt-BR')
    )

  return {
    status: 200,
    data: {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map(toPatient),
      total: filtered.length,
      page,
      pageSize,
      totais: {
        ativos: all.filter((p) => p.status === 'ATIVO').length,
        arquivados: all.filter((p) => p.status === 'ARQUIVADO').length
      }
    }
  }
}

function createPatient(req: MockRequest): MockResult {
  requireRole(req, 'PSICOLOGO')
  validatePatient(req.body ?? {}, false)
  const all = readPatients()
  const created: DbPatient = {
    id: crypto.randomUUID(),
    nome: String(req.body.nome).trim(),
    data_nascimento: req.body.data_nascimento,
    status: 'ATIVO',
    proxima_sessao: null,
    financeiro: 'EM_DIA',
    endereco: null,
    responsaveis: [],
    registros: []
  }
  writePatients([...all, created])
  return { status: 201, data: toPatient(created) }
}

function getPatient(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  return { status: 200, data: toPatient(findPatient(readPatients(), id)) }
}

function updatePatient(req: MockRequest, [id]: string[]): MockResult {
  const user = requireRole(req, 'PSICOLOGO')
  const body: Record<string, unknown> = req.body ?? {}
  validatePatient(body, true)
  const all = readPatients()
  const patient = findPatient(all, id)

  const { status, ...fields } = body
  if (Object.keys(fields).length > 0) assertEditable(patient)

  Object.entries(fields).forEach(([key, value]) => {
    // null apaga o campo opcional
    ;(patient as unknown as Record<string, unknown>)[key] = value === null ? undefined : value
  })
  if (typeof fields.nome === 'string') patient.nome = fields.nome.trim()

  if (status && status !== patient.status) {
    patient.status = status as PatientStatus
    if (status === 'ARQUIVADO') {
      patient.arquivado_em = new Date().toISOString()
      patient.arquivado_por = user.name
    } else {
      patient.arquivado_em = null
      patient.arquivado_por = null
    }
  }
  writePatients(all)
  return { status: 200, data: toPatient(patient) }
}

function deletePatient(req: MockRequest, [id]: string[]): MockResult {
  const payload = requireRole(req, 'PSICOLOGO')
  const all = readPatients()
  const patient = findPatient(all, id)
  if (patient.status !== 'ARQUIVADO')
    throw new MockHttpError(409, 'Só é possível excluir pacientes arquivados.', 'PATIENT_NOT_ARCHIVED')

  const senha = String(req.body?.senha ?? '')
  if (!senha) throw new MockHttpError(422, 'Informe sua senha.', 'VALIDATION_ERROR', { senha: 'Informe sua senha' })
  // A senha é conferida com a conta de quem está logado (no mock, as contas ficam no localStorage).
  // Se a conta não está no mock (login feito na API real), qualquer senha preenchida é aceita.
  const account = readUsers().find((u) => u.id === payload.sub)
  if (account && account.password !== senha)
    throw new MockHttpError(403, 'Senha incorreta.', 'INVALID_PASSWORD', { senha: 'Senha incorreta' })

  writePatients(all.filter((p) => p.id !== id))
  return { status: 204, data: null }
}

// ── Endereço ─────────────────────────────────────────────────────────────────
function validateAddress(a: Partial<Address>) {
  const e: Record<string, string> = {}
  if (isBlank(a.logradouro)) e.logradouro = 'O logradouro é obrigatório'
  if (isBlank(a.numero)) e.numero = 'O número é obrigatório'
  if (isBlank(a.bairro)) e.bairro = 'O bairro é obrigatório'
  if (isBlank(a.municipio)) e.municipio = 'O município é obrigatório'
  if (isBlank(a.estado)) e.estado = 'O estado é obrigatório'
  if (typeof a.cep !== 'string' || !/^\d{8}$/.test(a.cep)) e.cep = 'O CEP deve conter exatamente 8 dígitos'
  fail(e)
}

function getAddress(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const patient = findPatient(readPatients(), id)
  if (!patient.endereco) throw new MockHttpError(404, 'Endereço não cadastrado.', 'ADDRESS_NOT_FOUND')
  return { status: 200, data: patient.endereco }
}

function createAddress(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const all = readPatients()
  const patient = findPatient(all, id)
  assertEditable(patient)
  if (patient.endereco) throw new MockHttpError(409, 'O paciente já possui endereço cadastrado.', 'ADDRESS_EXISTS')
  validateAddress(req.body ?? {})
  patient.endereco = { ...req.body, complemento: req.body.complemento ?? null }
  writePatients(all)
  return { status: 201, data: patient.endereco }
}

function updateAddress(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const all = readPatients()
  const patient = findPatient(all, id)
  assertEditable(patient)
  if (!patient.endereco) throw new MockHttpError(404, 'Endereço não cadastrado.', 'ADDRESS_NOT_FOUND')
  const merged = { ...patient.endereco, ...(req.body ?? {}) } as Address
  validateAddress(merged)
  patient.endereco = merged
  writePatients(all)
  return { status: 200, data: merged }
}

// ── Responsáveis (até 3; endereço = o do paciente) ──────────────────────────
function validateGuardian(g: Partial<Guardian>, partial: boolean) {
  const e: Record<string, string> = {}
  const need = (key: keyof Guardian) => !partial || key in g
  if (need('nome') && isBlank(g.nome)) e.nome = 'O nome do responsável é obrigatório'
  if (need('data_nascimento') && !isIsoDate(g.data_nascimento)) e.data_nascimento = 'Informe uma data de nascimento válida no formato AAAA-MM-DD'
  if (need('telefone') && !/^\d{10,11}$/.test(String(g.telefone ?? ''))) e.telefone = 'O telefone deve conter DDD e 8 ou 9 dígitos'
  if (need('cpf') && !/^\d{11}$/.test(String(g.cpf ?? ''))) e.cpf = 'O CPF do responsável deve conter 11 dígitos numéricos'
  if (need('email') && !/^\S+@\S+\.\S+$/.test(String(g.email ?? ''))) e.email = 'Informe um e-mail válido para o responsável'
  if (need('parentesco') && !KINSHIPS.includes(String(g.parentesco))) e.parentesco = 'Parentesco inválido'
  fail(e)
}

function listGuardians(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  return { status: 200, data: findPatient(readPatients(), id).responsaveis }
}

function createGuardian(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const all = readPatients()
  const patient = findPatient(all, id)
  assertEditable(patient)
  if (!patient.endereco)
    throw new MockHttpError(409, 'Cadastre o endereço do paciente antes de adicionar responsáveis.', 'ADDRESS_REQUIRED')
  if (patient.responsaveis.length >= MAX_GUARDIANS)
    throw new MockHttpError(409, `Cada paciente pode ter no máximo ${MAX_GUARDIANS} responsáveis.`, 'GUARDIAN_LIMIT')
  validateGuardian(req.body ?? {}, false)
  const created: Guardian = { ...req.body, id: crypto.randomUUID() }
  patient.responsaveis.push(created)
  writePatients(all)
  return { status: 201, data: created }
}

function updateGuardian(req: MockRequest, [id, guardianId]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const all = readPatients()
  const patient = findPatient(all, id)
  assertEditable(patient)
  const guardian = patient.responsaveis.find((g) => g.id === guardianId)
  if (!guardian) throw new MockHttpError(404, 'Responsável não encontrado.', 'GUARDIAN_NOT_FOUND')
  validateGuardian(req.body ?? {}, true)
  Object.assign(guardian, req.body)
  writePatients(all)
  return { status: 200, data: guardian }
}

function deleteGuardian(req: MockRequest, [id, guardianId]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const all = readPatients()
  const patient = findPatient(all, id)
  assertEditable(patient)
  if (!patient.responsaveis.some((g) => g.id === guardianId))
    throw new MockHttpError(404, 'Responsável não encontrado.', 'GUARDIAN_NOT_FOUND')
  patient.responsaveis = patient.responsaveis.filter((g) => g.id !== guardianId)
  writePatients(all)
  return { status: 204, data: null }
}

function saveAddressPut(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const all = readPatients()
  const patient = findPatient(all, id)
  assertEditable(patient)
  const merged = { ...(patient.endereco ?? {}), ...(req.body ?? {}) } as Address
  validateAddress(merged)
  patient.endereco = merged
  writePatients(all)
  return { status: 200, data: merged }
}

function listRecords(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'PSICOLOGO')
  const records = [...findPatient(readPatients(), id).registros].sort((a, b) => b.data_hora.localeCompare(a.data_hora))
  return { status: 200, data: records }
}

export const patientRoutes: MockRoute[] = [
  { method: 'GET', pattern: /^\/pacientes?$/, handler: listPatients },
  { method: 'POST', pattern: /^\/pacientes?$|^\/paciente\/cadastrar$/, handler: createPatient },
  { method: 'GET', pattern: /^\/pacientes?\/([^/]+)$/, handler: getPatient },
  { method: 'PATCH', pattern: /^\/pacientes?\/([^/]+)$/, handler: updatePatient },
  { method: 'DELETE', pattern: /^\/pacientes?\/([^/]+)$/, handler: deletePatient },
  { method: 'GET', pattern: /^\/pacientes?\/([^/]+)\/endereco$/, handler: getAddress },
  { method: 'POST', pattern: /^\/pacientes?\/([^/]+)\/endereco$/, handler: createAddress },
  { method: 'PATCH', pattern: /^\/pacientes?\/([^/]+)\/endereco$/, handler: updateAddress },
  { method: 'PUT', pattern: /^\/pacientes?\/([^/]+)\/endereco$/, handler: saveAddressPut },
  { method: 'GET', pattern: /^\/pacientes?\/([^/]+)\/(?:responsaveis|responsavel)$/, handler: listGuardians },
  { method: 'POST', pattern: /^\/pacientes?\/([^/]+)\/(?:responsaveis|responsavel)$/, handler: createGuardian },
  { method: 'PATCH', pattern: /^\/pacientes?\/([^/]+)\/(?:responsaveis|responsavel)\/([^/]+)$/, handler: updateGuardian },
  { method: 'DELETE', pattern: /^\/pacientes?\/([^/]+)\/(?:responsaveis|responsavel)\/([^/]+)$/, handler: deleteGuardian },
  { method: 'GET', pattern: /^\/pacientes?\/([^/]+)\/registros$/, handler: listRecords }
]
