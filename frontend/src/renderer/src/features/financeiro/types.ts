export type StatusPagamento = 'PAGA' | 'PENDENTE'

export const STATUS_LABEL: Record<StatusPagamento, string> = { PAGA: 'Paga', PENDENTE: 'Pendente' }

/** Sessão (consulta) do paciente com o pagamento (US31/US32). */
export interface PagamentoSessao {
  id: string
  inicio: string // ISO
  fim: string // ISO
  local: string
  valor: number
  status: StatusPagamento
  pago_em: string | null
}

export interface Recebimento {
  id: string
  pago_em: string
  valor: number
  paciente: { nome: string }
}

export interface Faturamento {
  mes: string // AAAA-MM
  total: number
  recebimentos: Recebimento[]
}

export interface Pacote {
  id: string
  quantidade_sessoes: number
  valor_total: number
}

export interface Parcela {
  numero: number
  vencimento: string // AAAA-MM-DD
  valor: number
  status: StatusPagamento
}

/** Pacote atribuído a um paciente (US35). */
export interface PacotePaciente extends Pacote {
  parcelas: Parcela[]
}
