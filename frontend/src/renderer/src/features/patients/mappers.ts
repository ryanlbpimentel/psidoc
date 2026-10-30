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
  if (parseMoney(values.renda_familiar ?? '') !== parseMoney(base.renda_familiar)) dto.renda_familiar = parseMoney(values.renda_familiar)
  if (changed('observacoes')) dto.observacoes = values.observacoes.trim() || null
  return dto
}

export function hasPersonalChanges(values: Partial<PersonalValues>, saved: Patient): boolean {
  if (!values || values.nome === undefined) return false
  const base = toPersonalForm(saved)
  return (
    (values.nome ?? '').trim() !== base.nome.trim() ||
    (values.data_nascimento ?? '').trim() !== base.data_nascimento.trim() ||
    onlyDigits(values.cpf ?? '') !== onlyDigits(base.cpf) ||
    onlyDigits(values.telefone ?? '') !== onlyDigits(base.telefone) ||
    (values.genero ?? '') !== base.genero ||
    parseMoney(values.renda_familiar ?? '') !== parseMoney(base.renda_familiar) ||
    (values.observacoes ?? '').trim() !== base.observacoes.trim()
  )
}

// ── Endereço ─────────────────────────────────────────────────────────────────
export const normalizeUf = (uf?: string | null) => {
  const clean = (uf ?? '').trim().toUpperCase()
  return clean === 'UF' ? '' : clean
}
export const toAddressForm = (a: Address | null): AddressValues => ({
  logradouro: a?.logradouro ?? '',
  numero: a?.numero ?? '',
  complemento: a?.complemento ?? '',
  bairro: a?.bairro ?? '',
  municipio: a?.municipio ?? '',
  estado: normalizeUf(a?.estado),
  cep: a ? maskCep(a.cep) : ''
})

export const addressPayload = (v: AddressValues, exists: boolean): AddressDto => ({
  logradouro: v.logradouro.trim(),
  numero: v.numero.trim(),
  // complemento é opcional: ao cadastrar omite; ao atualizar, vazio apaga.
  complemento: v.complemento.trim() || (exists ? null : undefined),
  bairro: v.bairro.trim(),
  municipio: v.municipio.trim(),
  estado: normalizeUf(v.estado),
  cep: onlyDigits(v.cep)
})

export function hasAddressChanges(values: Partial<AddressValues>, address: Address | null): boolean {
  if (!values) return false
  const currentUf = normalizeUf(values.estado)
  if (!address) {
    if (values.logradouro === undefined && values.cep === undefined) return false
    return (
      (values.logradouro ?? '').trim().length > 0 ||
      (values.numero ?? '').trim().length > 0 ||
      (values.complemento ?? '').trim().length > 0 ||
      (values.bairro ?? '').trim().length > 0 ||
      (values.municipio ?? '').trim().length > 0 ||
      currentUf.length > 0 ||
      onlyDigits(values.cep ?? '').length > 0
    )
  }
  if (values.logradouro === undefined && values.cep === undefined) return false
  const base = toAddressForm(address)
  return (
    (values.logradouro ?? '').trim() !== base.logradouro.trim() ||
    (values.numero ?? '').trim() !== base.numero.trim() ||
    (values.complemento ?? '').trim() !== base.complemento.trim() ||
    (values.bairro ?? '').trim() !== base.bairro.trim() ||
    (values.municipio ?? '').trim() !== base.municipio.trim() ||
    currentUf !== normalizeUf(base.estado) ||
    onlyDigits(values.cep ?? '') !== onlyDigits(base.cep)
  )
}

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

// ── Conversores Backend -> Frontend ──────────────────────────────────────────
export function mapPacienteToPatient(p: any): Patient {
  if (!p) return p
  const dataNasc = p.data_nascimento
    ? typeof p.data_nascimento === 'string'
      ? p.data_nascimento.slice(0, 10)
      : p.data_nascimento instanceof Date
        ? p.data_nascimento.toISOString().slice(0, 10)
        : String(p.data_nascimento)
    : ''

  return {
    id: String(p.id_paciente ?? p.id),
    nome: p.nome,
    data_nascimento: dataNasc,
    telefone: p.telefone ?? null,
    cpf: p.cpf ?? null,
    genero: (p.genero as Gender) ?? null,
    renda_familiar: p.renda_familiar != null ? Number(p.renda_familiar) : null,
    observacoes: p.observacoes ?? null,
    status: p.status,
    arquivado_em: p.arquivado_em ?? null,
    arquivado_por: p.arquivado_por ?? null,
    proxima_sessao: p.proxima_sessao ?? null,
    financeiro: p.financeiro ?? undefined
  }
}

export function mapBackendVinculoToGuardian(v: any): Guardian {
  const r = v.responsavel ?? v
  const dataNasc = r.data_nascimento
    ? typeof r.data_nascimento === 'string'
      ? r.data_nascimento.slice(0, 10)
      : r.data_nascimento instanceof Date
        ? r.data_nascimento.toISOString().slice(0, 10)
        : String(r.data_nascimento)
    : ''

  return {
    id: String(r.id_responsavel ?? v.id_responsavel ?? v.id ?? r.id),
    nome: r.nome ?? '',
    data_nascimento: dataNasc,
    telefone: r.telefone ?? '',
    cpf: r.cpf ?? '',
    email: r.email ?? '',
    parentesco: (v.parentesco ?? r.parentesco) as Kinship
  }
}

export function mapAddress(a: any): Address | null {
  if (!a) return null
  return {
    logradouro: a.logradouro ?? '',
    numero: a.numero ?? '',
    complemento: a.complemento ?? null,
    bairro: a.bairro ?? '',
    municipio: a.municipio ?? '',
    estado: a.estado ?? '',
    cep: a.cep ?? ''
  }
}
