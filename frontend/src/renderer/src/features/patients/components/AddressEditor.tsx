import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { SelectField } from '@/shared/components/ui/SelectField'
import { TextField } from '@/shared/components/ui/TextField'
import { maskCep } from '@/shared/lib/masks'
import { UF_OPTIONS } from '../constants'
import { addressPayload, toAddressForm } from '../mappers'
import { addressSchema, type AddressValues } from '../schemas'
import { patientsService } from '../services/patients.service'
import type { Address } from '../types'
import { SectionCard, SectionStatus } from './SectionCard'

interface Props {
  patientId: string
  address: Address | null
  onSaved: (address: Address) => void
  onDirtyChange: (dirty: boolean) => void
}

const FIELDS: (keyof AddressValues)[] = ['logradouro', 'numero', 'complemento', 'bairro', 'municipio', 'estado', 'cep']
const UF_SELECT = UF_OPTIONS.map((uf) => ({ value: uf, label: uf }))

export function AddressEditor({ patientId, address, onSaved, onDirtyChange }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const {
    register, handleSubmit, reset, setError,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<AddressValues>({ resolver: zodResolver(addressSchema), defaultValues: toAddressForm(address) })

  useEffect(() => {
    onDirtyChange(isDirty)
    if (isDirty) setJustSaved(false)
  }, [isDirty, onDirtyChange])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const saved = await patientsService.saveAddress(patientId, addressPayload(values, !!address), !!address)
      onSaved(saved)
      reset(toAddressForm(saved))
      setJustSaved(true)
    } catch (error) {
      const err = normalizeError(error)
      Object.entries(err.fieldErrors ?? {}).forEach(([field, message]) => {
        if (FIELDS.includes(field as keyof AddressValues)) setError(field as keyof AddressValues, { message })
      })
      setServerError(err.message)
    }
  })

  const state = address ? (isDirty ? 'dirty' : 'saved') : 'unsaved'

  return (
    <SectionCard title="Endereço" aside={<SectionStatus state={state} />}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        {justSaved && !isDirty && <Notice tone="success">Endereço salvo. Agora é possível cadastrar responsáveis.</Notice>}

        <div className="grid gap-4 md:grid-cols-[1fr_120px_220px]">
          <TextField label="Logradouro *" placeholder="Rua, avenida..." autoComplete="off" error={errors.logradouro?.message} {...register('logradouro')} />
          <TextField label="Número *" autoComplete="off" error={errors.numero?.message} {...register('numero')} />
          <TextField label="Complemento (opcional)" placeholder="Apto, bloco..." autoComplete="off" error={errors.complemento?.message} {...register('complemento')} />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_110px]">
          <TextField label="Bairro *" autoComplete="off" error={errors.bairro?.message} {...register('bairro')} />
          <TextField label="Município *" autoComplete="off" error={errors.municipio?.message} {...register('municipio')} />
          <SelectField label="UF *" placeholder="UF" options={UF_SELECT} error={errors.estado?.message} {...register('estado')} />
        </div>
        <div className="max-w-[220px]">
          <TextField
            label="CEP *" placeholder="00000-000" inputMode="numeric" autoComplete="off" error={errors.cep?.message}
            {...register('cep', { onChange: (e) => (e.target.value = maskCep(e.target.value)) })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-caption text-muted">* Campos obrigatórios para salvar o endereço</p>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            <Check className="size-4" aria-hidden /> Salvar endereço
          </Button>
        </div>
      </form>
    </SectionCard>
  )
}
