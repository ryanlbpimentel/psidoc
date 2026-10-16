import { z } from 'zod'
import { isValidBirthDate } from '@/shared/lib/date'
import { onlyDigits } from '@/shared/lib/masks'

const required = (message = 'Campo obrigatório') => z.string().trim().min(1, message)
const birthDate = z.string().refine(isValidBirthDate, 'Informe uma data válida (DD/MM/AAAA)')
const cpf11 = (v: string) => onlyDigits(v).length === 11
const phone = (v: string) => [10, 11].includes(onlyDigits(v).length)

export const newPatientSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome completo do paciente'),
  data_nascimento: birthDate
})

// O back só exige nome e data de nascimento; o resto é opcional (CPF e telefone: só validam se preenchidos).
export const personalSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome completo do paciente'),
  data_nascimento: birthDate,
  cpf: z.string().refine((v) => v === '' || cpf11(v), 'O CPF deve conter 11 dígitos'),
  telefone: z.string().refine((v) => v === '' || phone(v), 'O telefone deve conter DDD e 8 ou 9 dígitos'),
  genero: z.string(),
  renda_familiar: z.string(),
  observacoes: z.string()
})

export const addressSchema = z.object({
  logradouro: required(),
  numero: required(),
  complemento: z.string(),
  bairro: required(),
  municipio: required(),
  estado: required(),
  cep: z.string().refine((v) => onlyDigits(v).length === 8, 'O CEP deve conter 8 dígitos')
})

export const guardianSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome completo do responsável'),
  data_nascimento: birthDate,
  cpf: z.string().refine(cpf11, 'O CPF deve conter 11 dígitos'),
  telefone: z.string().refine(phone, 'O telefone deve conter DDD e 8 ou 9 dígitos'),
  email: z.string().trim().email('Informe um e-mail válido'),
  parentesco: required('Selecione o parentesco')
})

export const deletePatientSchema = z.object({
  senha: z.string().min(1, 'Informe sua senha'),
  confirmar: z.boolean().refine((v) => v, 'Confirme para continuar')
})

export type NewPatientValues = z.infer<typeof newPatientSchema>
export type PersonalValues = z.infer<typeof personalSchema>
export type AddressValues = z.infer<typeof addressSchema>
export type GuardianValues = z.infer<typeof guardianSchema>
export type DeletePatientValues = z.infer<typeof deletePatientSchema>
