import { api } from '@/core/http/api'
import type { LoginResponse } from './auth.types'

export interface LoginPayload {
  email: string
  password: string
}

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}
