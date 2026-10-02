import type { UserRole, UserStatus } from '@/core/auth/auth.types'

export interface MockUser {
  id: string
  name: string
  email: string
  phone: string
  cpf: string // somente dígitos
  crp?: string
  password: string // texto puro: aceitável SÓ aqui, no mock
  roles: UserRole[]
  status: UserStatus
}

const KEY = 'psidoc:mock:users'
const RESET_KEY = 'psidoc:mock:reset-tokens'

const psi = (id: string, name: string, email: string, crp: string, status: UserStatus): MockUser => ({
  id, name, email, crp, status, phone: '', cpf: '', password: 'Psidoc123', roles: ['PSICOLOGO']
})

// Contas para testar:
//   gestor@psidoc.com  / admin123  → só a área do gestor
//   katia@psidoc.com   / Psidoc123 → só a área do psicólogo (Dashboard)
//   rafael@psidoc.com  / Psidoc123 → psicólogo E gestor (as duas áreas na barra lateral)
//   daniel.martins@equilibrio.com.br / Psidoc123 → bloqueado (aguardando aprovação)
const SEED: MockUser[] = [
  { id: 'u-gestor', name: 'Marina Rocha', email: 'gestor@psidoc.com', phone: '', cpf: '', password: 'admin123', roles: ['GESTOR'], status: 'ATIVO' },
  psi('u-katia', 'Dra. Katia', 'katia@psidoc.com', '99/99999', 'ATIVO'),
  { ...psi('u-rafael', 'Dr. Rafael Nogueira', 'rafael@psidoc.com', '05/70123', 'ATIVO'), roles: ['PSICOLOGO', 'GESTOR'] },
  psi('u-ana', 'Ana Clara Monteiro', 'ana.monteiro@equilibrio.com.br', '05/48291', 'ATIVO'),
  psi('u-bruno', 'Bruno Henrique Costa', 'bruno.costa@equilibrio.com.br', '05/51704', 'ATIVO'),
  psi('u-clarice', 'Clarice Fontes', 'clarice.fontes@equilibrio.com.br', '05/39822', 'ATIVO'),
  psi('u-daniel', 'Daniel Martins', 'daniel.martins@equilibrio.com.br', '05/56310', 'EM_ANALISE'),
  psi('u-elisa', 'Elisa Lima', 'elisa.lima@equilibrio.com.br', '05/44709', 'INATIVO'),
  psi('u-fernanda', 'Fernanda Alves', 'fernanda.alves@equilibrio.com.br', '05/60010', 'EM_ANALISE')
]

export function writeUsers(users: MockUser[]) {
  localStorage.setItem(KEY, JSON.stringify(users))
}

/** Migra o formato antigo (`role` único) e acrescenta seeds novos sem apagar o que já existe. */
function migrate(stored: (Omit<MockUser, 'status'> & { role?: UserRole; status: UserStatus | 'CONVITE_PENDENTE' })[]): MockUser[] {
  const users = stored.map(({ role, ...u }) => ({
    ...u,
    // O status "convite pendente" foi removido: contas antigas nesse status passam para "em análise".
    status: (u.status === 'CONVITE_PENDENTE' ? 'EM_ANALISE' : u.status) as UserStatus,
    roles: u.roles?.length ? u.roles : role ? [role] : ['PSICOLOGO' as UserRole] }))
  const missing = SEED.filter((seed) => !users.some((u) => u.id === seed.id))
  return [...users, ...missing]
}

export function readUsers(): MockUser[] {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    try {
      const migrated = migrate(JSON.parse(raw))
      writeUsers(migrated)
      return migrated
    } catch {
      /* banco corrompido: recria abaixo */
    }
  }
  writeUsers(SEED)
  return SEED
}

// ── Tokens de recuperação de senha ───────────────────────────────────────────
export interface MockResetToken {
  token: string
  userId: string
  expiresAt: number // ms
}

export function readResetTokens(): MockResetToken[] {
  try {
    return JSON.parse(localStorage.getItem(RESET_KEY) ?? '[]') as MockResetToken[]
  } catch {
    return []
  }
}

export function writeResetTokens(tokens: MockResetToken[]) {
  localStorage.setItem(RESET_KEY, JSON.stringify(tokens))
}
