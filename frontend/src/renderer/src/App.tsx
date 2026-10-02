import { useEffect } from 'react'
import { HashRouter, useNavigate } from 'react-router-dom'
import { AuthProvider } from '@/core/auth/AuthContext'
import { AppRoutes } from '@/routes'

// Links externos (psidoc://nova-senha?token=...) chegam pelo processo principal e viram navegação.
function DeepLinkListener() {
  const navigate = useNavigate()
  useEffect(() => window.api?.onDeepLink((route) => navigate(route)), [navigate])
  return null
}

// HashRouter é obrigatório no Electron: em produção o app roda em file://,
// onde o BrowserRouter não consegue resolver as rotas.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <DeepLinkListener />
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
