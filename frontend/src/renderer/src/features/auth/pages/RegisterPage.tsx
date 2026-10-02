import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, IdCard, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { AuthLayout } from '@/layout/AuthLayout'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { PasswordField, TextField } from '@/shared/components/ui/TextField'
import { maskCpf, maskCrp, maskPhone } from '@/shared/lib/masks'
import { AuthHeading } from '../components/AuthHeading'
import { StepProgress } from '../components/StepProgress'
import {
  accountSchema,
  professionalSchema,
  type AccountValues,
  type ProfessionalValues
} from '../schemas/auth.schemas'
import { authService } from '../services/auth.service'
import type { NoticeState } from '../types'

const FooterLogin = () => (
  <p className="mt-5 text-center text-caption text-muted">
    Já possui uma conta?{' '}
    <Link to="/login" className="font-bold text-brand-900 hover:underline">
      Entrar
    </Link>
  </p>
)

// As duas etapas vivem no mesmo componente: a senha fica só em memória até o envio final.
export function RegisterPage() {
  const [account, setAccount] = useState<AccountValues | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  return step === 1 ? (
    <AuthLayout
      cardWidth="lg"
      badge="Comece com segurança"
      headline="Organize sua rotina"
      description="Crie seu acesso ao PSIDOC e prepare um espaço profissional pensado para a profissionais da psicologia."
    >
      <AccountStep
        defaultValues={account}
        onNext={(values) => {
          setAccount(values)
          setStep(2)
        }}
      />
    </AuthLayout>
  ) : (
    <AuthLayout
      cardWidth="lg"
      badge="Validação profissional"
      headline="Confiança começa com uma identidade verificada."
      description="Esta etapa protege a comunidade PSIDOC e reforça a segurança no tratamento de informações clínicas."
    >
      {account && <ProfessionalStep account={account} onBack={() => setStep(1)} />}
    </AuthLayout>
  )
}

function AccountStep({ defaultValues, onNext }: { defaultValues: AccountValues | null; onNext: (v: AccountValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaultValues ?? { name: '', phone: '', email: '', password: '', confirmPassword: '' }
  })

  return (
    <>
      <AuthHeading eyebrow="Crie sua conta" title="Boas-vindas ao PSIDOC" description="Informe seus dados de acesso. Na próxima etapa, validaremos o seu registro profissional." />
      <StepProgress step={1} />
      <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-4">
        <TextField label="Nome completo" icon={UserRound} placeholder="Seu nome completo" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextField
          label="Telefone" icon={Phone} placeholder="(99) 99999-9999" inputMode="tel" autoComplete="tel" error={errors.phone?.message}
          {...register('phone', { onChange: (e) => (e.target.value = maskPhone(e.target.value)) })}
        />
        <TextField label="E-mail" icon={Mail} type="email" placeholder="nome@exemplo.com.br" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <div className="grid grid-cols-2 gap-3">
          <PasswordField label="Senha" placeholder="••••••••" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <PasswordField label="Confirmação de senha" placeholder="••••••••" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </div>
        <p className="text-caption text-muted">Use pelo menos 8 caracteres.</p>
        <Button type="submit" className="w-full">
          Continuar <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>
      <FooterLogin />
    </>
  )
}

function ProfessionalStep({ account, onBack }: { account: AccountValues; onBack: () => void }) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<ProfessionalValues>({ resolver: zodResolver(professionalSchema), defaultValues: { cpf: '', crp: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const { confirmPassword: _ignored, ...accountData } = account
      void _ignored
      const { status } = await authService.register({ ...accountData, ...values })
      const notice: NoticeState =
        status === 'ATIVO'
          ? { tone: 'success', message: 'Registro validado! Seu acesso já está liberado. Entre para continuar.' }
          : { tone: 'info', message: 'Cadastro enviado para análise (até 1 dia útil). Você poderá entrar assim que o gestor aprovar.' }
      navigate('/login', { replace: true, state: { notice } })
    } catch (error) {
      const apiError = normalizeError(error)
      if (apiError.fieldErrors?.cpf) setError('cpf', { message: apiError.fieldErrors.cpf })
      setServerError(apiError.message)
    }
  })

  return (
    <>
      <AuthHeading eyebrow="Validação profissional" title="Confirme seu registro" description="Precisamos de alguns dados para validar sua atuação. A análise é protegida e leva até 1 dia útil." />
      <StepProgress step={2} />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        <TextField
          label="CPF" icon={IdCard} placeholder="123.456.789-00" inputMode="numeric" error={errors.cpf?.message}
          {...register('cpf', { onChange: (e) => (e.target.value = maskCpf(e.target.value)) })}
        />
        <TextField
          label="CRP" icon={IdCard} placeholder="05/12345" inputMode="numeric" error={errors.crp?.message}
          {...register('crp', { onChange: (e) => (e.target.value = maskCrp(e.target.value)) })}
        />
        <Notice icon={ShieldCheck}>O CRP será usado para validar seu registro profissional.</Notice>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Enviar para validação
        </Button>
        <Button variant="ghost" size="sm" onClick={onBack} className="w-full">
          <ArrowLeft className="size-3.5" aria-hidden /> Voltar
        </Button>
      </form>
      <FooterLogin />
    </>
  )
}
