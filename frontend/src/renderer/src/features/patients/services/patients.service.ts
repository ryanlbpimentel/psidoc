import { api } from '@/core/http/api'
import { normalizeError } from '@/core/http/errors'
import { onlyDigits } from '@/shared/lib/masks'
import { mapAddress, mapBackendVinculoToGuardian, mapPacienteToPatient } from '../mappers'
import type {
  Address, AddressDto, CreatePatientDto, Guardian, GuardianDto, Patient, PatientRecord, PatientsPage, UpdatePatientDto
} from '../types'

const BASE = '/paciente'

export const patientsService = {
  async list(params: { status: 'ATIVO' | 'ARQUIVADO'; busca: string; page: number; pageSize: number }): Promise<PatientsPage> {
    const { data } = await api.get(BASE, {
      params: {
        status: params.status,
        busca: params.busca || undefined,
        page: params.page,
        limit: params.pageSize,
        pageSize: params.pageSize
      }
    })

    const rawItems = data?.itens ?? data?.items ?? []
    const items: Patient[] = rawItems.map(mapPacienteToPatient)
    const total: number = data?.total ?? items.length
    const page: number = data?.pagina ?? data?.page ?? params.page
    const pageSize: number = data?.limite ?? data?.pageSize ?? params.pageSize

    return {
      items,
      total,
      page,
      pageSize,
      totais: data?.totais
    }
  },

  async create(dto: CreatePatientDto): Promise<Patient> {
    const { data } = await api.post(`${BASE}/cadastrar`, dto)
    return mapPacienteToPatient(data)
  },

  async get(id: string): Promise<Patient> {
    const { data } = await api.get(`${BASE}/${id}`)
    return mapPacienteToPatient(data)
  },

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const { data } = await api.patch(`${BASE}/${id}`, dto)
    return mapPacienteToPatient(data)
  },

  /** Arquivar = atualizar o status (o StatusPaciente do AtualizarPacienteDto). */
  archive(id: string) {
    return patientsService.update(id, { status: 'ARQUIVADO' })
  },

  /** Exclusão: só paciente arquivado, e exige a senha de quem está logado. */
  async remove(id: string, senha: string): Promise<void> {
    await api.delete(`${BASE}/${id}`, { data: { senha } })
  },

  // Endereço
  async getAddress(id: string): Promise<Address | null> {
    try {
      const { data } = await api.get(`${BASE}/${id}`)
      return mapAddress(data?.endereco)
    } catch (error) {
      if (normalizeError(error).status === 404) return null
      throw error
    }
  },

  async saveAddress(id: string, dto: AddressDto, _exists: boolean): Promise<Address> {
    const { data } = await api.put(`${BASE}/${id}/endereco`, dto)
    return mapAddress(data?.endereco ?? data) ?? dto
  },

  // Responsáveis (máximo 3 por paciente)
  async listGuardians(id: string): Promise<Guardian[]> {
    const { data } = await api.get(`${BASE}/${id}`)
    if (!data) return []
    const list = data.responsaveis ?? []
    return list.map(mapBackendVinculoToGuardian)
  },

  async createGuardian(id: string, dto: GuardianDto): Promise<Guardian> {
    const { data } = await api.post(`${BASE}/${id}/responsavel`, dto)
    const list: Guardian[] = (data?.responsaveis ?? []).map(mapBackendVinculoToGuardian)
    const created =
      list.find((g) => onlyDigits(g.cpf) === onlyDigits(dto.cpf)) ??
      list[list.length - 1]
    if (created) return created

    const fresh = await patientsService.listGuardians(id)
    const fallback =
      fresh.find((g) => onlyDigits(g.cpf) === onlyDigits(dto.cpf)) ??
      fresh[fresh.length - 1]

    if (fallback) return fallback

    throw new Error('Não foi possível obter o identificador do responsável cadastrado.')
  },

  async updateGuardian(id: string, guardianId: string, dto: GuardianDto): Promise<Guardian> {
    const { data } = await api.patch(`${BASE}/${id}/responsavel/${guardianId}`, dto)
    const list: Guardian[] = (data?.responsaveis ?? []).map(mapBackendVinculoToGuardian)
    const updated = list.find((g) => String(g.id) === String(guardianId))
    if (updated) return updated

    const fresh = await patientsService.listGuardians(id)
    const fallback = fresh.find((g) => String(g.id) === String(guardianId))
    if (fallback) return fallback

    return { id: guardianId, ...dto }
  },

  async removeGuardian(id: string, guardianId: string): Promise<void> {
    await api.delete(`${BASE}/${id}/responsavel/${guardianId}`)
  },

  // Registros do paciente (usado na consulta de arquivados)
  async listRecords(id: string): Promise<PatientRecord[]> {
    try {
      const { data } = await api.get<PatientRecord[]>(`${BASE}/${id}/registros`)
      return data ?? []
    } catch (error) {
      if (normalizeError(error).status === 404) return []
      throw error
    }
  }
}
