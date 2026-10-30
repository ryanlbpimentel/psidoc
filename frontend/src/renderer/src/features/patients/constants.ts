import type { FinanceStatus, Gender, Kinship, Patient } from './types'

export const MAX_GUARDIANS = 3
export const LIST_PAGE_SIZE = 6

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
  { value: 'NAO_INFORMADO', label: 'Não informado' }
]

export const KINSHIP_OPTIONS: { value: Kinship; label: string }[] = [
  { value: 'PAI', label: 'Pai' },
  { value: 'MAE', label: 'Mãe' },
  { value: 'PADRASTO', label: 'Padrasto' },
  { value: 'MADRASTA', label: 'Madrasta' },
  { value: 'AVOS', label: 'Avós' },
  { value: 'IRMAOS', label: 'Irmãos' },
  { value: 'TUTOR_LEGAL', label: 'Tutor(a) legal' },
  { value: 'OUTRO', label: 'Outro' }
]

export const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export const FINANCE_LABEL: Record<FinanceStatus, string> = {
  EM_DIA: 'Em dia',
  PENDENTE: 'Pendente',
  ATRASADO: 'Atrasado'
}

export const genderLabel = (value?: string | null) => GENDER_OPTIONS.find((o) => o.value === value)?.label
export const kinshipLabel = (value?: string | null) => KINSHIP_OPTIONS.find((o) => o.value === value)?.label ?? ''

/** Concordância usada nas telas do Figma ("Ativa", "Arquivada", "a paciente"). */
export const isFemale = (p: Pick<Patient, 'genero'>) => p.genero === 'FEMININO'
export const statusLabel = (p: Pick<Patient, 'genero' | 'status'>) => {
  const f = isFemale(p)
  if (p.status === 'ARQUIVADO') return f ? 'Arquivada' : 'Arquivado'
  if (p.status === 'FINALIZADO') return f ? 'Finalizada' : 'Finalizado'
  return f ? 'Ativa' : 'Ativo'
}
