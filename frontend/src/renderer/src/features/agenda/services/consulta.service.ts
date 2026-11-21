import { api } from '@/core/http/api'
import type { Consulta, ReminderChannel, Sessao } from '../types'

interface RawConsulta {
  id_consulta: number | string
  id_paciente: number | string
  inicio: string
  fim: string
  local: string
  paciente?: { nome: string }
  minutos_restantes?: number
  alertar?: boolean
}

const map = (r: RawConsulta): Consulta => ({
  id: String(r.id_consulta),
  id_paciente: String(r.id_paciente),
  inicio: r.inicio,
  fim: r.fim,
  local: r.local,
  paciente: { nome: r.paciente?.nome ?? '—' }
})

// O back usa ids numéricos; o mock usa ids em texto.
const apiId = (id: string) => (/^\d+$/.test(id) ? Number(id) : id)

export const consultaService = {
  /** GET /consulta?data_inicio&data_fim — sem período o back devolve TODAS, por isso sempre enviamos um. */
  async list(period: { from: string; to: string }): Promise<Consulta[]> {
    const { data } = await api.get<RawConsulta[]>('/consulta', { params: { data_inicio: period.from, data_fim: period.to } })
    return data.map(map)
  },

  /** POST /consulta/agendar — duração fixa de 1h no back; 409 se houver conflito de horário. */
  async schedule(input: { pacienteId: string; inicio: string; local: string }): Promise<Consulta> {
    const { data } = await api.post<RawConsulta>('/consulta/agendar', {
      id_paciente: apiId(input.pacienteId),
      inicio: input.inicio,
      local: input.local
    })
    return map(data)
  },

  /** GET /consulta/em-andamento */
  async ongoing(): Promise<Sessao[]> {
    const { data } = await api.get<RawConsulta[]>('/consulta/em-andamento')
    return data.map((r) => ({ ...map(r), minutos_restantes: r.minutos_restantes ?? 0, alertar: !!r.alertar }))
  },

  /** PATCH /consulta/:id/estender — +10 min, uma única vez por consulta. */
  async extend(id: string): Promise<Consulta> {
    const { data } = await api.patch<RawConsulta>(`/consulta/${id}/estender`)
    return map(data)
  },

  /** POST /consulta/:id/lembrete — o texto é montado pelo back. */
  async sendReminder(id: string, canal: ReminderChannel): Promise<void> {
    await api.post(`/consulta/${id}/lembrete`, { canal })
  }
}
