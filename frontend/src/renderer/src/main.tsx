import './assets/main.css'

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ MOCK DE BACKEND — fica no início de propósito, para ser fácil de remover.
// `setupApi` testa a API real e usa o mock só nas rotas que ainda não existem.
// Quando o backend estiver completo: apague a pasta `core/mock` e estas linhas.
import { api } from '@/core/http/api'
import { setupApi } from '@/core/mock'
// ─────────────────────────────────────────────────────────────────────────────

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

async function bootstrap() {
  await setupApi(api) // MOCK — remover junto com a pasta core/mock
  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

void bootstrap()
