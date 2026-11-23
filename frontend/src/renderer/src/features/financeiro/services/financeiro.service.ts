import { api } from '@/core/http/api'
import type { Faturamento, Pacote, PacotePaciente, PagamentoSessao, Parcela, StatusPagamento } from '../types'

// O back ainda não tem o módulo financeiro: o contrato está em core/mock/financeiro.handlers.ts.
interface RawPagamento {
  id_consulta: number | string
  inicio: string
  fim: string
  local: string
  valor: number
  status_pagamento: StatusPagamento
  pago_em: string | null
}

interface RawPacote {
  id_pacote: number | string
  quantidade_sessoes: number
  valor_total: number
}

const mapPagamento = (r: RawPagamento): PagamentoSessao => ({
  id: String(r.id_consulta), inicio: r.inicio, fim: r.fim, local: r.local,
  valor: Number(r.valor), status: r.status_pagamento, pago_em: r.pago_em
})

const mapPacote = (r: RawPacote): Pacote => ({ id: String(r.id_pacote), quantidade_sessoes: r.quantidade_sessoes, valor_total: Number(r.valor_total) })

export const financeiroService = {
  /** GET /financeiro/pagamentos?id_paciente */
  async pagamentos(pacienteId: string): Promise<PagamentoSessao[]> {
    const { data } = await api.get<RawPagamento[]>('/financeiro/pagamentos', { params: { id_paciente: pacienteId } })
    return data.map(mapPagamento)
  },

  /** PATCH /financeiro/pagamentos/:id_consulta */
  async registrarPagamento(consultaId: string, status: StatusPagamento): Promise<PagamentoSessao> {
    const { data } = await api.patch<RawPagamento>(`/financeiro/pagamentos/${consultaId}`, { status_pagamento: status })
    return mapPagamento(data)
  },

  /** GET /financeiro/faturamento?mes=AAAA-MM */
  async faturamento(mes: string): Promise<Faturamento> {
    const { data } = await api.get<{ mes: string; total: number; recebimentos: { id_consulta: number | string; pago_em: string; valor: number; paciente: { nome: string } }[] }>(
      '/financeiro/faturamento', { params: { mes } }
    )
    return {
      mes: data.mes,
      total: Number(data.total),
      recebimentos: data.recebimentos.map((r) => ({ id: String(r.id_consulta), pago_em: r.pago_em, valor: Number(r.valor), paciente: r.paciente }))
    }
  },

  /** GET /financeiro/pacotes */
  async pacotes(): Promise<Pacote[]> {
    const { data } = await api.get<RawPacote[]>('/financeiro/pacotes')
    return data.map(mapPacote)
  },

  /** POST /financeiro/pacotes */
  async cadastrarPacote(input: { quantidade_sessoes: number; valor_total: number }): Promise<Pacote> {
    const { data } = await api.post<RawPacote>('/financeiro/pacotes', input)
    return mapPacote(data)
  },

  /** GET /financeiro/pacotes/paciente/:id */
  async pacotesDoPaciente(pacienteId: string): Promise<PacotePaciente[]> {
    const { data } = await api.get<(RawPacote & { id_pacote_paciente: number | string; parcelas: Parcela[] })[]>(`/financeiro/pacotes/paciente/${pacienteId}`)
    return data.map((r) => ({ ...mapPacote(r), id: String(r.id_pacote_paciente), parcelas: r.parcelas }))
  }
}
