import { api } from '@/core/http/api'
import type { UserStatus } from '@/core/auth/auth.types'
import type { AccountValues, ProfessionalValues } from '../schemas/auth.schemas'

export type RegisterPayload = Omit<AccountValues, 'confirmPassword'> & ProfessionalValues

export const authService = {
  // Login fica em core/auth (o AuthContext precisa dele).
  async register(payload: RegisterPayload) {
    const { data } = await api.post<{ status: UserStatus }>('/auth/register', payload)
    return data
  },
  async forgotPassword(email: string) {
    // `devResetLink` só existe no mock (simula o e-mail). A API real nunca devolve isso.
    const { data } = await api.post<{ message: string; devResetLink?: string }>('/auth/forgot-password', { email })
    return data
  },
  async resetPassword(payload: { token: string; password: string }) {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', payload)
    return data
  }
}
