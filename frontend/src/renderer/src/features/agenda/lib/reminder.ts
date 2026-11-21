import type { Consulta } from '../types'

// O back monta o texto do lembrete (ConsultaService.enviarLembrete) e o fuso da mensagem é este.
const FUSO_HORARIO = 'America/Sao_Paulo'

/** Idêntico ao texto que o back envia: a prévia mostra exatamente o que a paciente vai receber. */
export function buildReminderMessage(c: Pick<Consulta, 'inicio' | 'local' | 'paciente'>, psychologistName: string) {
  const inicio = new Date(c.inicio)
  const data = inicio.toLocaleDateString('pt-BR', { timeZone: FUSO_HORARIO })
  const hora = inicio.toLocaleTimeString('pt-BR', { timeZone: FUSO_HORARIO, hour: '2-digit', minute: '2-digit' })
  return `Olá, ${c.paciente.nome}! Lembrete da sua consulta com ${psychologistName} no dia ${data} às ${hora}. Local: ${c.local}.`
}

/** (85) 9····-4821 — mantém o DDD e os 4 últimos dígitos. */
export function maskPhone(digits: string) {
  const d = digits.replace(/\D/g, '')
  if (d.length < 10) return '····'
  return `(${d.slice(0, 2)}) ${d.length === 11 ? '9' : ''}····-${d.slice(-4)}`
}
