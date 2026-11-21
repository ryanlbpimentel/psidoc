export interface Consulta {
  id: string
  id_paciente: string
  inicio: string // ISO
  fim: string // ISO
  local: string
  paciente: { nome: string }
}

/** Consulta em andamento (GET /consulta/em-andamento). */
export interface Sessao extends Consulta {
  minutos_restantes: number
  alertar: boolean
}

export type ReminderChannel = 'WHATSAPP' | 'SMS'
export const CHANNEL_LABEL: Record<ReminderChannel, string> = { WHATSAPP: 'WhatsApp', SMS: 'SMS' }
