import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { ApiError, normalizeError } from '@/core/http/errors'
import { AuthLayout } from '@/layout/AuthLayout'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { PasswordField, TextField } from '@/shared/components/ui/TextField'
import { AuthHeading } from '../components/AuthHeading'
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas/auth.schemas'
import { authService } from '../services/auth.service'

/**
 * Destino do link do e-mail: `#/nova-senha?token=...`.
 * Se o app foi aberto sem o token (ex.: o cliente de e-mail não abriu o link), mostra um campo
 * para colar o código que veio no e-mail.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenFromLink = searchParams.get('token')?.trim() ?? ''
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<ApiError | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromLink, password: '', confirmPassword: '' }
  })

  const onSubmit = handleSubmit(async ({ token, password }) => {
    setServerError(null)
    try {
      await authService.resetPassword({ token, password })
      navigate('/login', {
        replace: true,
        state: { notice: { tone: 'success', message: 'Senha atualizada! Entre com a nova senha.' } }
      })
    } catch (error) {
      setServerError(normalizeError(error))
    }
  })

  const tokenProblem = serverError?.code === 'INVALID_RESET_TOKEN'

  return (
    <AuthLayout
      badge="Recupere com calma"
      headline="Seu acesso pode ser retomado em poucos passos."
      description="Enviaremos uma orientação para o e-mail vinculado à sua conta PSIDOC."
    >
      <AuthHeading eyebrow="Recuperar senha" title="Digite sua nova senha" description="Crie uma nova senha segura para acessar sua conta." />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && (
          <Notice tone="error">
            {serverError.message}
            {tokenProblem && (
              <>
                {' '}
                <Link to="/recuperar-senha" className="font-bold underline">
                  Solicitar novo link
                </Link>
              </>
            )}
          </Notice>
        )}

        {!tokenFromLink && (
          <TextField label="Código de recuperação" icon={KeyRound} placeholder="Cole o código recebido por e-mail" autoComplete="off" error={errors.token?.message} {...register('token')} />
        )}
        <PasswordField label="Nova senha" placeholder="••••••••" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <PasswordField label="Confirmação de senha" placeholder="••••••••" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Salvar
        </Button>
      </form>

      <p className="mt-5 text-center text-caption text-muted">
        Lembrou sua senha?{' '}
        <Link to="/login" className="font-bold text-brand-900 hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
