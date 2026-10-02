import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { handleMockRequest, MockHttpError } from './handlers'

const LATENCY_MS = 350
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildResponse = (config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse => ({
  data, status, statusText: String(status), headers: {}, config, request: {}
})

/** Adapter do Axios que responde no lugar da rede, como se fosse a API real. */
export const mockAdapter: AxiosAdapter = async (config) => {
  await sleep(LATENCY_MS)

  const method = (config.method ?? 'get').toUpperCase()
  const path = (config.url ?? '').replace(/^https?:\/\/[^/]+/, '').split('?')[0]
  const query = Object.fromEntries(
    Object.entries(config.params ?? {})
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  )
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? {})
  const auth = String(config.headers?.get('Authorization') ?? '')
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

  try {
    const { status, data } = handleMockRequest({ method, path, query, body, token })
    console.debug(`[mock] ${method} ${path} → ${status}`)
    return buildResponse(config, status, data)
  } catch (error) {
    if (!(error instanceof MockHttpError)) throw error
    console.debug(`[mock] ${method} ${path} → ${error.status}`)
    const response = buildResponse(config, error.status, {
      message: error.message, code: error.code, errors: error.fieldErrors
    })
    throw new AxiosError(
      error.message,
      error.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config, null, response
    )
  }
}
