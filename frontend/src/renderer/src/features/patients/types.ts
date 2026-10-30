// Os nomes dos campos seguem os DTOs do backend (snake_case em português).
// Os valores dos enums são uma suposição — confirmar no Swagger e ajustar em `constants.ts`.

export type PatientStatus = 'ATIVO' | 'ARQUIVADO' | 'FINALIZADO'
export type Gender = 'MASCULINO' | 'FEMININO' | 'OUTRO' | 'NAO_INFORMADO'
export type Kinship = 'PAI' | 'MAE' | 'PADRASTO' | 'MADRASTA' | 'AVOS' | 'IRMAOS' | 'TUTOR_LEGAL' | 'OUTRO'
export type FinanceStatus = 'EM_DIA' | 'PENDENTE' | 'ATRASADO'

export interface Patient {
  id: string
  nome: string
  data_nascimento: string // AAAA-MM-DD
  telefone?: string | null // só dígitos, com DDD
  cpf?: string | null // 11 dígitos
  genero?: Gender | null
  renda_familiar?: number | null
  observacoes?: string | null
  status: PatientStatus
  // Ainda não confirmados no back (opcionais): quando e por quem foi arquivado.
  arquivado_em?: string | null
  arquivado_por?: string | null
  // Só existem no mock: dependem dos módulos de agenda e financeiro, que ainda não existem.
  proxima_sessao?: string | null
  financeiro?: FinanceStatus
}

export interface Address {
  logradouro: string
  numero: string
  complemento?: string | null
  bairro: string
  municipio: string
  estado: string // UF
  cep: string // 8 dígitos
}

export interface Guardian {
  id: string
  nome: string
  data_nascimento: string // AAAA-MM-DD
  telefone: string
  cpf: string
  email: string
  parentesco: Kinship
}

export interface PatientRecord {
  id: string
  data_hora: string // ISO
  titulo: string
  tipo: 'OBSERVACAO' | 'ACOMPANHAMENTO'
  autor: string
  autor_crp: string
  local: string
  conteudo: string
}

export interface PatientsPage {
  items: Patient[]
  total: number
  page: number
  pageSize: number
  totais?: { ativos: number; arquivados: number }
}

// Corpos enviados à API
export interface CreatePatientDto {
  nome: string
  data_nascimento: string
}
export interface UpdatePatientDto {
  nome?: string
  data_nascimento?: string
  telefone?: string | null
  cpf?: string | null
  genero?: Gender | null
  renda_familiar?: number | null
  observacoes?: string | null
  status?: PatientStatus
}
export type AddressDto = Address
export type GuardianDto = Omit<Guardian, 'id'>

export interface FlashNotice {
  tone: 'success' | 'info'
  message: string
}
