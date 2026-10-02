import axios from 'axios'
import { tokenStorage } from '@/core/auth/token'
import { normalizeError } from './errors'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  timeout: 10_000
})

// O AuthContext registra aqui o que fazer num 401 (limpar sessão), sem acoplar o http ao React.
let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

// Tratamento central de erros: os componentes só recebem um ApiError já normalizado.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = normalizeError(error)
    if (apiError.status === 401 && tokenStorage.get()) onUnauthorized?.()
    return Promise.reject(apiError)
  }
)
