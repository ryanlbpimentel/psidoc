import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { SelectField } from '@/shared/components/ui/SelectField'
import { TextAreaField } from '@/shared/components/ui/TextAreaField'
import { TextField } from '@/shared/components/ui/TextField'
import { maskCpf, maskDate, maskMoney, maskPhone } from '@/shared/lib/masks'
import { GENDER_OPTIONS } from '../constants'
import { hasPersonalChanges, personalPayload, toPersonalForm } from '../mappers'
import { personalSchema, type PersonalValues } from '../schemas'
import { patientsService } from '../services/patients.service'
import type { Patient } from '../types'
import { SectionCard, SectionStatus } from './SectionCard'

interface Props {
  patient: Patient
  onSaved: (patient: Patient) => void
  onDirtyChange: (dirty: boolean) => void
}

const FIELDS: (keyof PersonalValues)[] = ['nome', 'data_nascimento', 'cpf', 'telefone', 'genero', 'renda_familiar', 'observacoes']

export function PersonalDataEditor({ patient, onSaved, onDirtyChange }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const {
    register, handleSubmit, reset, setError, setValue, watch,
    formState: { errors, isSubmitting }
  } = useForm<PersonalValues>({ resolver: zodResolver(personalSchema), defaultValues: toPersonalForm(patient) })

  useEffect(() => {
    reset(toPersonalForm(patient))
  }, [patient, reset])

  const formValues = watch()
  const isDirty = useMemo(
    () => hasPersonalChanges(formValues, patient),
    [formValues, patient]
  )

  useEffect(() => {
    onDirtyChange(isDirty)
    if (isDirty) setJustSaved(false)
  }, [isDirty, onDirtyChange])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    const dto = personalPayload(values, patient)
    if (Object.keys(dto).length === 0) return
    try {
      const updated = await patientsService.update(patient.id, dto)
      onSaved(updated)
      reset(toPersonalForm(updated))
      setJustSaved(true)
    } catch (error) {
      const err = normalizeError(error)
      Object.entries(err.fieldErrors ?? {}).forEach(([field, message]) => {
        if (FIELDS.includes(field as keyof PersonalValues)) setError(field as keyof PersonalValues, { message })
      })
      setServerError(err.message)
    }
  })

  return (
    <SectionCard title="Dados pessoais" aside={<SectionStatus state={isDirty ? 'dirty' : 'saved'} />}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        {justSaved && !isDirty && <Notice tone="success">Dados pessoais salvos.</Notice>}

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <TextField label="Nome completo *" autoComplete="off" error={errors.nome?.message} {...register('nome')} />
          <TextField
            label="Data de nascimento *" placeholder="DD/MM/AAAA" inputMode="numeric" autoComplete="off" error={errors.data_nascimento?.message}
            {...register('data_nascimento', {
              onChange: (e) => {
                const masked = maskDate(e.target.value)
                e.target.value = masked
                setValue('data_nascimento', masked)
              }
            })}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="CPF (opcional)" placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" error={errors.cpf?.message}
            {...register('cpf', {
              onChange: (e) => {
                const masked = maskCpf(e.target.value)
                e.target.value = masked
                setValue('cpf', masked)
              }
            })}
          />
          <TextField
            label="Telefone (opcional)" placeholder="(00) 00000-0000" inputMode="tel" autoComplete="off" error={errors.telefone?.message}
            {...register('telefone', {
              onChange: (e) => {
                const masked = maskPhone(e.target.value)
                e.target.value = masked
                setValue('telefone', masked)
              }
            })}
          />
          <SelectField label="Gênero (opcional)" placeholder="Selecionar gênero" options={GENDER_OPTIONS} error={errors.genero?.message} {...register('genero')} />
          <TextField
            label="Renda familiar (R$) (opcional)" placeholder="Ex.: 3.500,00" inputMode="numeric" autoComplete="off" error={errors.renda_familiar?.message}
            {...register('renda_familiar', {
              onChange: (e) => {
                const masked = maskMoney(e.target.value)
                e.target.value = masked
                setValue('renda_familiar', masked)
              }
            })}
          />
        </div>
        <TextAreaField label="Observações / notas (opcional)" placeholder="Informações relevantes para o acompanhamento." maxLength={5000} error={errors.observacoes?.message} {...register('observacoes')} />

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-caption text-muted">* Campos obrigatórios</p>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            <Check className="size-4" aria-hidden /> Salvar dados pessoais
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}
