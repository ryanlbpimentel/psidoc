import type { SessionUser, TokenPayload, UserRole, UserStatus } from '@/core/auth/auth.types'
import { decodeToken } from '@/core/auth/token'
import { maskCrp, isValidCrp } from '@/shared/lib/masks'
import { readResetTokens, readUsers, writeResetTokens, writeUsers, type MockUser } from './db'

export class MockHttpError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string>
  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export interface MockRequest {
  method: string
  path: string
  query: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
  token: string | null
}
interface MockResult {
  status: number
  data: unknown
}

const onlyDigits = (v: string) => v.replace(/\D/g, '')

/**
 * REGRA DO MOCK para a validação do CRP:
 * CRP terminado em "0" "não é encontrado" no conselho → cadastro vai para análise do gestor.
 * Qualquer outro CRP é validado na hora e o usuário já nasce ATIVO.
 */
const isCrpFound = (crp: string) => !crp.endsWith('0')

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // o texto da tela diz "expira em 30 minutos"

// ── JWT falso (header.payload.assinatura) ────────────────────────────────────
const b64url = (obj: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function signFakeToken(user: MockUser) {
  const payload: TokenPayload = {
    sub: user.id, name: user.name, email: user.email, roles: user.roles, crp: user.crp,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  }
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.mock-signature`
}
const toSession = (u: MockUser): SessionUser => ({ id: u.id, name: u.name, email: u.email, roles: u.roles, crp: u.crp })

function requireRole(req: MockRequest, role: UserRole) {
  const payload = req.token ? decodeToken(req.token) : null
  if (!payload || payload.exp * 1000 < Date.now()) throw new MockHttpError(401, 'Sessão expirada. Entre novamente.')
  const roles = payload.roles ?? (payload.role ? [payload.role] : [])
  if (!roles.includes(role)) throw new MockHttpError(403, 'Você não tem permissão para acessar este recurso.')
}

// ── Handlers ─────────────────────────────────────────────────────────────────
function register({ body }: MockRequest): MockResult {
  const { name, phone, email, password, cpf, crp } = body ?? {}
  if (!name || !email || !password || !cpf || !crp) throw new MockHttpError(422, 'Preencha todos os campos obrigatórios.')

  if (!isValidCrp(String(crp)))
    throw new MockHttpError(422, 'O CRP deve ter 7 dígitos.', 'INVALID_CRP', { crp: 'O CRP deve ter 7 dígitos (ex.: 05/12345)' })

  const users = readUsers()
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase()))
    throw new MockHttpError(409, 'Este e-mail já está cadastrado.', 'EMAIL_TAKEN', { email: 'E-mail já cadastrado' })
  if (users.some((u) => u.cpf && u.cpf === onlyDigits(cpf)))
    throw new MockHttpError(409, 'Este CPF já está cadastrado.', 'CPF_TAKEN', { cpf: 'CPF já cadastrado' })

  const formattedCrp = maskCrp(String(crp)) // sempre salvo como NN/NNNNN
  const status: UserStatus = isCrpFound(formattedCrp) ? 'ATIVO' : 'EM_ANALISE'
  const user: MockUser = {
    id: `u-${Date.now()}`, name: String(name).trim(), email: String(email).trim(), phone, cpf: onlyDigits(cpf),
    crp: formattedCrp, password, roles: ['PSICOLOGO'], status
  }
  writeUsers([...users, user])
  return { status: 201, data: { status } }
}

function login({ body }: MockRequest): MockResult {
  const email = String(body?.email ?? '').trim().toLowerCase()
  const user = readUsers().find((u) => u.email.toLowerCase() === email)
  if (!user || user.password !== body?.password)
    throw new MockHttpError(401, 'E-mail ou senha incorretos.', 'INVALID_CREDENTIALS')

  if (user.status === 'EM_ANALISE')
    throw new MockHttpError(403, 'Aguardando aprovação. Seu registro profissional ainda está em análise.', 'PENDING_APPROVAL')
  if (user.status === 'INATIVO')
    throw new MockHttpError(403, 'Seu acesso está inativo. Fale com o gestor da clínica.', 'ACCOUNT_INACTIVE')

  return { status: 200, data: { token: signFakeToken(user), user: toSession(user) } }
}

// Sempre 200, mesmo sem o e-mail existir (não revela quais e-mails estão cadastrados).
// Como o mock não envia e-mail de verdade, ele devolve `devResetLink` (só quando a conta existe)
// e imprime o "e-mail" no console. A API real não terá esse campo.
function forgotPassword({ body }: MockRequest): MockResult {
  const email = String(body?.email ?? '').trim().toLowerCase()
  const user = readUsers().find((u) => u.email.toLowerCase() === email)
  const data: { message: string; devResetLink?: string } = {
    message: 'Se o e-mail estiver cadastrado, você receberá o link de recuperação.'
  }
  if (user) {
    const token = crypto.randomUUID()
    const now = Date.now()
    // Um token ativo por usuário: pedir um novo link invalida o anterior.
    const others = readResetTokens().filter((t) => t.userId !== user.id && t.expiresAt > now)
    writeResetTokens([...others, { token, userId: user.id, expiresAt: now + RESET_TOKEN_TTL_MS }])
    data.devResetLink = `/nova-senha?token=${token}`
    console.info(`[mock] E-mail para ${user.email}\n  código: ${token}\n  link: psidoc://nova-senha?token=${token}`)
  }
  return { status: 200, data }
}

function resetPassword({ body }: MockRequest): MockResult {
  const token = String(body?.token ?? '').trim()
  const password = String(body?.password ?? '')
  if (password.length < 8)
    throw new MockHttpError(422, 'Use pelo menos 8 caracteres.', 'WEAK_PASSWORD', { password: 'Use pelo menos 8 caracteres' })

  const tokens = readResetTokens()
  const record = tokens.find((t) => t.token === token)
  if (!record || record.expiresAt < Date.now())
    throw new MockHttpError(400, 'Link inválido ou expirado. Solicite um novo link de recuperação.', 'INVALID_RESET_TOKEN')

  const users = readUsers()
  const user = users.find((u) => u.id === record.userId)
  if (!user) throw new MockHttpError(400, 'Link inválido ou expirado. Solicite um novo link de recuperação.', 'INVALID_RESET_TOKEN')
  user.password = password
  writeUsers(users)
  writeResetTokens(tokens.filter((t) => t.userId !== user.id)) // token de uso único
  return { status: 200, data: { message: 'Senha atualizada com sucesso.' } }
}

function listPsychologists(req: MockRequest): MockResult {
  requireRole(req, 'GESTOR')
  const all = readUsers().filter((u) => u.roles.includes('PSICOLOGO'))
  const search = (req.query.search ?? '').toLowerCase()
  const searchDigits = onlyDigits(search)
  const status = req.query.status
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.max(1, Number(req.query.pageSize) || 5)

  const filtered = all.filter(
    (u) =>
      (!status || u.status === status) &&
      (!search ||
        [u.name, u.email, u.crp ?? ''].some((f) => f.toLowerCase().includes(search)) ||
        (searchDigits.length > 0 && onlyDigits(u.crp ?? '').includes(searchDigits)))
  )
  return {
    status: 200,
    data: {
      items: filtered
        .slice((page - 1) * pageSize, page * pageSize)
        .map((u) => ({ id: u.id, name: u.name, email: u.email, crp: u.crp ?? '', status: u.status })),
      total: filtered.length, page, pageSize,
      summary: {
        registered: all.length,
        active: all.filter((u) => u.status === 'ATIVO').length,
        pending: all.filter((u) => u.status === 'EM_ANALISE').length
      }
    }
  }
}

const STATUSES: UserStatus[] = ['ATIVO', 'EM_ANALISE', 'INATIVO']
function updateStatus(req: MockRequest, [id]: string[]): MockResult {
  requireRole(req, 'GESTOR')
  const status = req.body?.status as UserStatus
  if (!STATUSES.includes(status)) throw new MockHttpError(422, 'Status inválido.')
  const users = readUsers()
  const target = users.find((u) => u.id === id && u.roles.includes('PSICOLOGO'))
  if (!target) throw new MockHttpError(404, 'Profissional não encontrado.')
  target.status = status
  writeUsers(users)
  return { status: 200, data: { id: target.id, name: target.name, email: target.email, crp: target.crp ?? '', status } }
}

// ── Tabela de rotas ──────────────────────────────────────────────────────────
type Handler = (req: MockRequest, params: string[]) => MockResult
const routes: { method: string; pattern: RegExp; handler: Handler }[] = [
  { method: 'POST', pattern: /^\/auth\/register$/, handler: register },
  { method: 'POST', pattern: /^\/auth\/login$/, handler: login },
  { method: 'POST', pattern: /^\/auth\/forgot-password$/, handler: forgotPassword },
  { method: 'POST', pattern: /^\/auth\/reset-password$/, handler: resetPassword },
  { method: 'GET', pattern: /^\/manager\/psychologists$/, handler: listPsychologists },
  { method: 'PATCH', pattern: /^\/manager\/psychologists\/([^/]+)\/status$/, handler: updateStatus }
]

export function handleMockRequest(req: MockRequest): MockResult {
  for (const route of routes) {
    const match = req.path.match(route.pattern)
    if (route.method === req.method && match) return route.handler(req, match.slice(1))
  }
  throw new MockHttpError(404, `Rota não encontrada no mock: ${req.method} ${req.path}`)
}
