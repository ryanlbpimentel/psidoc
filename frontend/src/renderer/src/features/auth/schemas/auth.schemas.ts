import { z } from 'zod'
import { isValidCpf, isValidCrp } from '@/shared/lib/masks'

export const accountSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe seu nome completo'),
    phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Informe um telefone válido'),
    email: z.string().trim().email('Informe um e-mail válido'),
    password: z.string().min(8, 'Use pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha')
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não coincidem' })

export const professionalSchema = z.object({
  cpf: z.string().refine(isValidCpf, 'Informe um CPF válido'),
  crp: z.string().refine(isValidCrp, 'O CRP deve ter 7 dígitos (ex.: 05/12345)')
})

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha')
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido')
})

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Cole o código recebido por e-mail'),
    password: z.string().min(8, 'Use pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha')
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não coincidem' })

export type AccountValues = z.infer<typeof accountSchema>
export type ProfessionalValues = z.infer<typeof professionalSchema>
export type LoginValues = z.infer<typeof loginSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
