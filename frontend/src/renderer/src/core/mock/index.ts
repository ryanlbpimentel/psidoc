import axios, { type AxiosAdapter, type AxiosInstance } from 'axios'
import { setApiSources, type ApiSource } from '@/core/http/apiStatus'
import { mockAdapter } from './adapter'

/**
 * ⚠️ MOCK DE BACKEND — remover esta pasta inteira quando a API real estiver pronta
 * (e as linhas marcadas em src/renderer/src/main.tsx). Nenhum outro arquivo depende dela.
 *
 * Como decide entre API real e mock (VITE_API_MODE no .env):
 *   auto (padrão) → ao abrir o app, testa cada grupo de rotas na API real. Se a rota existe
 *                   (qualquer resposta HTTP que não seja 404), usa a API; senão usa o mock.
 *   mock          → sempre mock.      real → sempre API real.
 * (VITE_USE_MOCK=true/false, do formato antigo, continua funcionando.)
 */
type Mode = 'auto' | 'mock' | 'real'

// Um item por grupo de rotas. `probe` é uma chamada "vazia" que só serve para saber se a rota existe:
// uma API implementada responde 400/401/403/422; uma rota que ainda não existe responde 404.
const GROUPS = [
  { name: 'auth', prefix: '/auth', probe: { method: 'POST', url: '/auth/login', data: {} } },
  { name: 'manager', prefix: '/manager', probe: { method: 'GET', url: '/manager/psychologists' } }
] as const

const PROBE_TIMEOUT_MS = 1500

function resolveMode(): Mode {
  const mode = import.meta.env.VITE_API_MODE as Mode | undefined
  if (mode === 'auto' || mode === 'mock' || mode === 'real') return mode
  if (import.meta.env.VITE_USE_MOCK === 'true') return 'mock'
  if (import.meta.env.VITE_USE_MOCK === 'false') return 'real'
  return 'auto'
}

async function isImplemented(baseURL: string, probe: (typeof GROUPS)[number]['probe']) {
  try {
    const res = await axios.request({
      baseURL, ...probe, timeout: PROBE_TIMEOUT_MS, validateStatus: () => true
    })
    const ok = res.status !== 404 && res.status < 502
    if (!ok) console.info(`[api] ${probe.method} ${probe.url} → ${res.status} (rota ainda não implementada)`)
    return ok
  } catch (error) {
    // Sem resposta: API desligada, porta errada, CORS ou CSP bloqueando.
    console.info(`[api] ${probe.method} ${probe.url} sem resposta (${(error as Error).message}). Usando mock.`)
    return false
  }
}

export async function setupApi(instance: AxiosInstance) {
  const mode = resolveMode()
  const baseURL = instance.defaults.baseURL ?? ''
  const realAdapter = axios.getAdapter(instance.defaults.adapter)

  const sources: Record<string, ApiSource> = {}
  if (mode === 'auto') {
    const results = await Promise.all(GROUPS.map((g) => isImplemented(baseURL, g.probe)))
    GROUPS.forEach((g, i) => (sources[g.name] = results[i] ? 'real' : 'mock'))
  } else {
    GROUPS.forEach((g) => (sources[g.name] = mode))
  }
  setApiSources(sources)
  console.info(`[api] modo=${mode} →`, sources)

  const router: AxiosAdapter = (config) => {
    const path = (config.url ?? '').replace(/^https?:\/\/[^/]+/, '')
    const group = GROUPS.find((g) => path.startsWith(g.prefix))
    // Rota fora dos grupos conhecidos: segue o modo global (e cai no mock em "auto").
    const source = group ? sources[group.name] : mode === 'real' ? 'real' : 'mock'
    return source === 'real' ? realAdapter(config) : mockAdapter(config)
  }
  instance.defaults.adapter = router
}
