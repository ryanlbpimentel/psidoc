import { brToIso, isoToBr } from '@/shared/lib/date'
import { maskCep, maskCpf, maskPhone, moneyFromNumber, onlyDigits, parseMoney } from '@/shared/lib/masks'
import type { Address, AddressDto, Gender, Guardian, GuardianDto, Kinship, Patient, UpdatePatientDto } from './types'
import type { AddressValues, GuardianValues, PersonalValues } from './schemas'

// ── Dados pessoais ───────────────────────────────────────────────────────────
export const toPersonalForm = (p: Patient): PersonalValues => ({
  nome: p.nome,
  data_nascimento: isoToBr(p.data_nascimento),
  cpf: p.cpf ? maskCpf(p.cpf) : '',
  telefone: p.telefone ? maskPhone(p.telefone) : '',
  genero: p.genero ?? '',
  renda_familiar: p.renda_familiar != null ? moneyFromNumber(p.renda_familiar) : '',
  observacoes: p.observacoes ?? ''
})

/**
 * Monta o corpo do PATCH só com o que mudou (o back aceita atualizar campo a campo).
 * Campo opcional apagado vai como `null`.
 */
export function personalPayload(values: PersonalValues, saved: Patient): UpdatePatientDto {
  const base = toPersonalForm(saved)
  const changed = (k: keyof PersonalValues) => values[k] !== base[k]
  const dto: UpdatePatientDto = {}
  if (changed('nome')) dto.nome = values.nome.trim()
  if (changed('data_nascimento')) dto.data_nascimento = brToIso(values.data_nascimento) ?? undefined
  if (changed('cpf')) dto.cpf = onlyDigits(values.cpf) || null
  if (changed('telefone')) dto.telefone = onlyDigits(values.telefone) || null
  if (changed('genero')) dto.genero = (values.genero as Gender) || null
  if (changed('renda_familiar')) dto.renda_familiar = parseMoney(values.renda_familiar)
  if (changed('observacoes')) dto.observacoes = values.observacoes.trim() || null
  return dto
}

// ── Endereço ─────────────────────────────────────────────────────────────────
export const toAddressForm = (a: Address | null): AddressValues => ({
  logradouro: a?.logradouro ?? '',
  numero: a?.numero ?? '',
  complemento: a?.complemento ?? '',
  bairro: a?.bairro ?? '',
  municipio: a?.municipio ?? '',
  estado: a?.estado ?? '',
  cep: a ? maskCep(a.cep) : ''
})

export const addressPayload = (v: AddressValues, exists: boolean): AddressDto => ({
  logradouro: v.logradouro.trim(),
  numero: v.numero.trim(),
  // complemento é opcional: ao cadastrar omite; ao atualizar, vazio apaga.
  complemento: v.complemento.trim() || (exists ? null : undefined),
  bairro: v.bairro.trim(),
  municipio: v.municipio.trim(),
  estado: v.estado,
  cep: onlyDigits(v.cep)
})

// ── Responsável ──────────────────────────────────────────────────────────────
export const toGuardianForm = (g: Guardian | null): GuardianValues => ({
  nome: g?.nome ?? '',
  data_nascimento: g ? isoToBr(g.data_nascimento) : '',
  cpf: g ? maskCpf(g.cpf) : '',
  telefone: g ? maskPhone(g.telefone) : '',
  email: g?.email ?? '',
  parentesco: g?.parentesco ?? ''
})

export const guardianPayload = (v: GuardianValues): GuardianDto => ({
  nome: v.nome.trim(),
  data_nascimento: brToIso(v.data_nascimento) ?? '',
  cpf: onlyDigits(v.cpf),
  telefone: onlyDigits(v.telefone),
  email: v.email.trim(),
  parentesco: v.parentesco as Kinship
})
