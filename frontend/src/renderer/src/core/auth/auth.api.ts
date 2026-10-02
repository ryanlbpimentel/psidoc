import { api } from '@/core/http/api'
import type { BackendLoginResponse, LoginResponse } from './auth.types'
import { sessionFromToken } from './token'

export interface LoginPayload {
  email: string
  password: string
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<BackendLoginResponse>('/usuario/login', {
    email: payload.email,
    senha: payload.password
  })

  const token = data.access_token
  const user = sessionFromToken(token)

  if (!user) {
    throw new Error('Falha ao decodificar a sessão do token recebido.')
  }

  return { token, user }
}