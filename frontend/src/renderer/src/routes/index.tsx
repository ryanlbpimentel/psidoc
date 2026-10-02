import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from '@/core/auth/guards'
import { AppLayout } from '@/layout/AppLayout'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ManagerPsychologistsPage } from '@/features/manager/pages/ManagerPsychologistsPage'
import { ComingSoonPage } from '@/shared/components/ComingSoonPage'
import { PSICOLOGO_NAV } from '@/layout/navigation'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      </Route>

      {/* Fora do PublicOnlyRoute: o link do e-mail precisa funcionar mesmo com alguém logado. */}
      <Route path="/nova-senha" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute roles={['PSICOLOGO']} />}>
        <Route element={<AppLayout />}>
          <Route path="/painel" element={<DashboardPage />} />
          {PSICOLOGO_NAV.filter((i) => i.to !== '/painel').map((item) => (
            <Route key={item.to} path={item.to} element={<ComingSoonPage title={item.label} />} />
          ))}
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['GESTOR']} />}>
        <Route element={<AppLayout />}>
          <Route path="/gestor/psicologos" element={<ManagerPsychologistsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
