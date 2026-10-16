import type { UserStatus } from '@/core/auth/auth.types'
import { readUsers, writeUsers, type MockUser } from './db'
import { MockHttpError, requireRole, type MockRequest, type MockResult, type MockRoute } from './http'

/**
 * Traduz o contrato REAL do backend (Nest: /usuario/* e /gestor/*, corpos em português)
 * para os handlers do mock. Assim o app funciona igual com a API ligada ou desligada:
 * o front não precisa saber quem está respondendo.
 *
 * Rotas e formatos espelham: backend/src/modules/usuario e backend/src/modules/gestor,
 * e o que o front lê em core/auth/auth.api.ts, auth.service.ts e manager.service.ts.
 */
type SimpleHandler = (req: MockRequest) => MockResult

interface AuthHandlers {
  register: SimpleHandler
  login: SimpleHandler
  forgotPassword: SimpleHandler
  resetPassword: SimpleHandler
}

// O back identifica o psicólogo por um id numérico; o mock usa ids em texto.
// A lista de usuários só cresce, então a posição (+1) serve de id numérico estável.
const numericId = (users: MockUser[], user: MockUser) => users.findIndex((u) => u.id === user.id) + 1
const byNumericId = (users: MockUser[], id: string) => {
  const user = users[Number(id) - 1]
  if (!user || !user.roles.includes('PSICOLOGO')) throw new MockHttpError(404, 'Psicólogo não encontrado.')
  return user
}

const toBackendPsicologo = (users: MockUser[], u: MockUser) => ({
  id_usuario: numericId(users, u),
  crp: u.crp ?? '',
  validado: u.status === 'EM_ANALISE' ? 'PENDENTE' : 'APROVADO',
  validado_em: null,
  usuario: {
    id_usuario: numericId(users, u),
    nome: u.name,
    email: u.email,
    cpf: u.cpf,
    telefone: u.phone,
    esta_ativo: u.status === 'ATIVO',
    criado_em: new Date().toISOString()
  }
})

function changeStatus(req: MockRequest, [id]: string[], status: UserStatus): MockResult {
  requireRole(req, 'GESTOR')
  const users = readUsers()
  byNumericId(users, id).status = status
  writeUsers(users)
  return { status: 200, data: {} }
}

export function backendRoutes(h: AuthHandlers): MockRoute[] {
  return [
    {
      method: 'POST',
      pattern: /^\/usuario\/login$/,
      handler: (req) => {
        const { data } = h.login({ ...req, body: { email: req.body?.email, password: req.body?.senha } })
        return { status: 200, data: { access_token: (data as { token: string }).token } }
      }
    },
    {
      method: 'POST',
      pattern: /^\/usuario\/registrar$/,
      handler: (req) => {
        const b = req.body ?? {}
        const { data } = h.register({
          ...req,
          body: { name: b.nome, email: b.email, cpf: b.cpf, phone: b.telefone, password: b.senha, crp: b.crp }
        })
        const aprovado = (data as { status: UserStatus }).status === 'ATIVO'
        return {
          status: 201,
          data: {
            validado: aprovado ? 'APROVADO' : 'PENDENTE',
            mensagem: aprovado
              ? 'Registro validado! Seu acesso já está liberado.'
              : 'Cadastro enviado para análise do gestor.'
          }
        }
      }
    },
    { method: 'POST', pattern: /^\/usuario\/esqueci-senha$/, handler: h.forgotPassword },
    {
      method: 'POST',
      pattern: /^\/usuario\/redefinir-senha$/,
      handler: (req) => h.resetPassword({ ...req, body: { token: req.body?.token, password: req.body?.novaSenha } })
    },
    { method: 'POST', pattern: /^\/usuario\/encerrar-sessao\/me$/, handler: () => ({ status: 200, data: {} }) },

    // ── Gestor ──────────────────────────────────────────────────────────────
    {
      method: 'GET',
      pattern: /^\/gestor\/psicologo$/,
      handler: (req) => {
        requireRole(req, 'GESTOR')
        const users = readUsers()
        const filter = req.query.status
        const items = users
          .filter((u) => u.roles.includes('PSICOLOGO'))
          .filter((u) => {
            if (!filter) return true
            if (filter === 'EM_ANALISE') return u.status === 'EM_ANALISE'
            if (filter === 'APROVADO') return u.status !== 'EM_ANALISE'
            return u.status === filter // ATIVO | INATIVO
          })
          .map((u) => toBackendPsicologo(users, u))
        return { status: 200, data: items }
      }
    },
    { method: 'PATCH', pattern: /^\/gestor\/psicologo\/([^/]+)\/aprovar$/, handler: (r, p) => changeStatus(r, p, 'ATIVO') },
    { method: 'PATCH', pattern: /^\/gestor\/psicologo\/([^/]+)\/ativar$/, handler: (r, p) => changeStatus(r, p, 'ATIVO') },
    { method: 'PATCH', pattern: /^\/gestor\/psicologo\/([^/]+)\/inativar$/, handler: (r, p) => changeStatus(r, p, 'INATIVO') },
    {
      // Reprovar = apagar o cadastro. O mock só marca como inativo para não bagunçar os ids numéricos.
      method: 'DELETE',
      pattern: /^\/gestor\/psicologo\/([^/]+)\/reprovar$/,
      handler: (r, p) => changeStatus(r, p, 'INATIVO')
    }
  ]
}
