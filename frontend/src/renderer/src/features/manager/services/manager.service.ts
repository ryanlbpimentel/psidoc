import { api } from '@/core/http/api'
import type { UserStatus } from '@/core/auth/auth.types'

export interface PsychologistRow {
  id: string
  name: string
  email: string
  crp: string
  status: UserStatus
  validacao: 'PENDENTE' | 'VALIDADO'
}

export interface PsychologistsPage {
  items: PsychologistRow[]
  total: number
  page: number
  pageSize: number
  summary: { registered: number; active: number; pending: number }
}
export type ManagerAction = 'APROVAR' | 'REPROVAR' | 'INATIVAR' | 'ATIVAR'
export type StatusFilter = 'TODOS' | 'ATIVO' | 'EM_ANALISE' | 'APROVADO' | 'INATIVO'

interface BackendPsicologo {
  id_usuario: number
  crp: string
  validado: 'PENDENTE' | 'APROVADO'
  validado_em: string | null
  usuario: {
    id_usuario: number
    nome: string
    email: string
    cpf: string
    telefone: string
    esta_ativo: boolean
    criado_em: string
  }
}

export const managerService = {
  async list(params: { search: string; status: StatusFilter; page: number; pageSize: number }): Promise<PsychologistsPage> {
    const { data } = await api.get<BackendPsicologo[]>('/gestor/psicologo', {
      params: { status: params.status === 'TODOS' ? undefined : params.status }
    })

    const allItems: PsychologistRow[] = data.map((item) => {
      let status: UserStatus = 'EM_ANALISE'
      if (item.validado === 'PENDENTE') {
        status = 'EM_ANALISE'
      } else if (item.usuario.esta_ativo) {
        status = 'ATIVO'
      } else {
        status = 'INATIVO'
      }

      return {
        id: String(item.id_usuario),
        name: item.usuario.nome,
        email: item.usuario.email,
        crp: item.crp,
        status,
        validacao: item.validado === 'APROVADO' ? 'VALIDADO' : 'PENDENTE'
      }
    })

    const searchNormalized = params.search.trim().toLowerCase()
    let filtered = allItems
    if (searchNormalized) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchNormalized) ||
          p.email.toLowerCase().includes(searchNormalized) ||
          p.crp.includes(searchNormalized)
      )
    }

    const start = (params.page - 1) * params.pageSize
    const paginatedItems = filtered.slice(start, start + params.pageSize)

    return {
      items: paginatedItems,
      total: filtered.length,
      page: params.page,
      pageSize: params.pageSize,
      summary: {
        registered: allItems.length,
        active: allItems.filter((i) => i.status === 'ATIVO').length,
        pending: allItems.filter((i) => i.status === 'EM_ANALISE').length
      }
    }
  },

  async executeAction(id: string, action: ManagerAction): Promise<{ id: string; action: ManagerAction }> {
    const numericId = Number(id)

    if (action === 'APROVAR') {
      await api.patch(`/gestor/psicologo/${numericId}/aprovar`)
    } else if (action === 'REPROVAR') {
      await api.delete(`/gestor/psicologo/${numericId}/reprovar`)
    } else if (action === 'INATIVAR') {
      await api.patch(`/gestor/psicologo/${numericId}/inativar`)
    } else if (action === 'ATIVAR') {
      await api.patch(`/gestor/psicologo/${numericId}/ativar`)
    }

    return { id, action }
  }
}