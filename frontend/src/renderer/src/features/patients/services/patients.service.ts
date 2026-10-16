import { api } from '@/core/http/api'
import { normalizeError } from '@/core/http/errors'
import type {
  Address, AddressDto, CreatePatientDto, Guardian, GuardianDto, Patient, PatientRecord, PatientsPage, UpdatePatientDto
} from '../types'

// ⚠️ Rotas supostas a partir dos nomes dos DTOs. Se o Swagger do back usar outros caminhos, é só ajustar aqui.
const BASE = '/pacientes'

export const patientsService = {
  async list(params: { status: 'ATIVO' | 'ARQUIVADO'; busca: string; page: number; pageSize: number }) {
    const { data } = await api.get<PatientsPage>(BASE, { params })
    return data
  },
  async create(dto: CreatePatientDto) {
    const { data } = await api.post<Patient>(BASE, dto)
    return data
  },
  async get(id: string) {
    const { data } = await api.get<Patient>(`${BASE}/${id}`)
    return data
  },
  async update(id: string, dto: UpdatePatientDto) {
    const { data } = await api.patch<Patient>(`${BASE}/${id}`, dto)
    return data
  },
  /** Arquivar = atualizar o status (o StatusPaciente do AtualizarPacienteDto). */
  archive(id: string) {
    return patientsService.update(id, { status: 'ARQUIVADO' })
  },
  /** Exclusão: só paciente arquivado, e exige a senha de quem está logado. */
  async remove(id: string, senha: string) {
    await api.delete(`${BASE}/${id}`, { data: { senha } })
  },

  // Endereço
  async getAddress(id: string): Promise<Address | null> {
    try {
      const { data } = await api.get<Address>(`${BASE}/${id}/endereco`)
      return data
    } catch (error) {
      if (normalizeError(error).status === 404) return null // ainda não cadastrado
      throw error
    }
  },
  async saveAddress(id: string, dto: AddressDto, exists: boolean) {
    const { data } = exists
      ? await api.patch<Address>(`${BASE}/${id}/endereco`, dto)
      : await api.post<Address>(`${BASE}/${id}/endereco`, dto)
    return data
  },

  // Responsáveis (máximo 3 por paciente)
  async listGuardians(id: string) {
    const { data } = await api.get<Guardian[]>(`${BASE}/${id}/responsaveis`)
    return data
  },
  async createGuardian(id: string, dto: GuardianDto) {
    const { data } = await api.post<Guardian>(`${BASE}/${id}/responsaveis`, dto)
    return data
  },
  async updateGuardian(id: string, guardianId: string, dto: GuardianDto) {
    const { data } = await api.patch<Guardian>(`${BASE}/${id}/responsaveis/${guardianId}`, dto)
    return data
  },
  async removeGuardian(id: string, guardianId: string) {
    await api.delete(`${BASE}/${id}/responsaveis/${guardianId}`)
  },

  // Registros do paciente (usado na consulta de arquivados)
  async listRecords(id: string) {
    const { data } = await api.get<PatientRecord[]>(`${BASE}/${id}/registros`)
    return data
  }
}
