import { api } from '@/core/http/api'
import type { UserStatus } from '@/core/auth/auth.types'
import { onlyDigits } from '@/shared/lib/masks'
import type { AccountValues, ProfessionalValues } from '../schemas/auth.schemas'

export type RegisterPayload = Omit<AccountValues, 'confirmPassword'> & ProfessionalValues

interface BackendRegisterResponse {
  validado: 'PENDENTE' | 'APROVADO'
  mensagem: string
}

export const authService = {
  async register(payload: RegisterPayload): Promise<{ status: UserStatus; message: string }> {
    const { data } = await api.post<BackendRegisterResponse>('/usuario/registrar', {
      nome: payload.name.trim(),
      email: payload.email.trim(),
      cpf: onlyDigits(payload.cpf),
      telefone: onlyDigits(payload.phone),
      senha: payload.password,
      crp: onlyDigits(payload.crp)
    })

    const status: UserStatus = data.validado === 'APROVADO' ? 'ATIVO' : 'EM_ANALISE'
    return { status, message: data.mensagem }
  },

  async forgotPassword(email: string): Promise<{ message: string; devResetLink?: string }> {
    const { data } = await api.post<{ message: string }>('/usuario/esqueci-senha', {
      email: email.trim()
    })
    return data
  },

  async resetPassword(payload: { token: string; password: string }): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/usuario/redefinir-senha', {
      token: payload.token.trim(),
      novaSenha: payload.password
    })
    return data
  }
}