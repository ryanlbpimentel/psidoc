import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Info, Mail } from 'lucide-react'
import { getErrorMessage } from '@/core/http/errors'
import { AuthLayout } from '@/layout/AuthLayout'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { TextField } from '@/shared/components/ui/TextField'
import { AuthHeading } from '../components/AuthHeading'
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas/auth.schemas'
import { authService } from '../services/auth.service'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setServerError(null)
    try {
      const { devResetLink } = await authService.forgotPassword(email)
      setDevResetLink(devResetLink ?? null)
      setSent(true)
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  })

  return (
    <AuthLayout
      badge="Recupere com calma"
      headline="Seu acesso pode ser retomado em poucos passos."
      description="Enviaremos uma orientação para o e-mail vinculado à sua conta PSIDOC."
    >
      <AuthHeading eyebrow="Recuperar senha" title="Vamos recuperar seu acesso" description="Digite o e-mail cadastrado. Você receberá um link para criar uma nova senha." />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {sent && <Notice tone="success">Link enviado! Confira sua caixa de entrada.</Notice>}
        {serverError && <Notice tone="error">{serverError}</Notice>}
        {/* Só aparece no mock, que não envia e-mail de verdade. A API real não devolve esse campo. */}
        {devResetLink && (
          <Notice tone="warning">
            Modo demonstração: nenhum e-mail foi enviado.{' '}
            <button type="button" onClick={() => navigate(devResetLink)} className="cursor-pointer font-bold underline">
              Abrir o link do e-mail
            </button>
          </Notice>
        )}

        <TextField label="E-mail cadastrado" icon={Mail} placeholder="nome@exemplo.com.br" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Button type="submit" loading={isSubmitting} className="w-full">
          {sent ? 'Reenviar link' : 'Enviar link de recuperação'}
        </Button>
        <Notice icon={Info}>O link expira em 30 minutos. Se não encontrar a mensagem, verifique a pasta de spam.</Notice>
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
