import { api } from '@/core/http/api'
import type { UserStatus } from '@/core/auth/auth.types'

export interface PsychologistRow {
  id: string
  name: string
  email: string
  crp: string
  status: UserStatus
}

export interface PsychologistsPage {
  items: PsychologistRow[]
  total: number
  page: number
  pageSize: number
  summary: { registered: number; active: number; pending: number }
}

export type StatusFilter = UserStatus | 'TODOS'

export const managerService = {
  async list(params: { search: string; status: StatusFilter; page: number; pageSize: number }) {
    const { data } = await api.get<PsychologistsPage>('/manager/psychologists', {
      params: { ...params, status: params.status === 'TODOS' ? undefined : params.status }
    })
    return data
  },
  async updateStatus(id: string, status: UserStatus) {
    const { data } = await api.patch<PsychologistRow>(`/manager/psychologists/${id}/status`, { status })
    return data
  }
}
