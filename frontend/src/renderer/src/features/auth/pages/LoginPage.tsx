import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Mail } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthContext'
import { homePathFor } from '@/core/auth/guards'
import { ApiError, normalizeError } from '@/core/http/errors'
import { AuthLayout } from '@/layout/AuthLayout'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { PasswordField, TextField } from '@/shared/components/ui/TextField'
import { AuthHeading } from '../components/AuthHeading'
import { loginSchema, type LoginValues } from '../schemas/auth.schemas'
import type { NoticeState } from '../types'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = (location.state as { notice?: NoticeState } | null)?.notice
  const [serverError, setServerError] = useState<ApiError | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const user = await login(values)
      navigate(homePathFor(user), { replace: true })
    } catch (error) {
      setServerError(normalizeError(error))
    }
  })

  return (
    <AuthLayout
      badge="Seu espaço profissional"
      headline="Entre, respire e siga com o seu dia."
      description="Sua rotina organizada em um ambiente intuitivo, acolhedor e protegido para a prática clínica."
    >
      <AuthHeading title="Que bom ter você de volta" description="Entre com seus dados para acessar o PSIDOC." />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {notice && !serverError && <Notice tone={notice.tone}>{notice.message}</Notice>}
        {serverError && (
          <Notice tone={serverError.code === 'PENDING_APPROVAL' ? 'warning' : 'error'}>{serverError.message}</Notice>
        )}

        <TextField label="E-mail" icon={Mail} type="email" placeholder="nome@exemplo.com.br" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Senha" placeholder="••••••••" autoComplete="current-password" error={errors.password?.message} {...register('password')} />

        <div className="flex justify-end">
          <Link to="/recuperar-senha" className="text-caption font-bold text-brand-900 hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Entrar <LogIn className="size-4" aria-hidden />
        </Button>
      </form>

      <p className="mt-5 text-center text-caption text-muted">
        Ainda não tem uma conta?{' '}
        <Link to="/cadastro" className="font-bold text-brand-900 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  )
}
