import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { TextField } from '@/shared/components/ui/TextField'
import { brToIso } from '@/shared/lib/date'
import { maskDate } from '@/shared/lib/masks'
import { newPatientSchema, type NewPatientValues } from '../schemas'
import { patientsService } from '../services/patients.service'
import type { FlashNotice } from '../types'

/** Popup de cadastro: só o essencial. O resto o psicólogo completa na ficha, aos poucos. */
export function NewPatientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register, handleSubmit, reset, setError,
    formState: { errors, isSubmitting }
  } = useForm<NewPatientValues>({ resolver: zodResolver(newPatientSchema), defaultValues: { nome: '', data_nascimento: '' } })

  useEffect(() => {
    if (open) {
      reset({ nome: '', data_nascimento: '' })
      setServerError(null)
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const patient = await patientsService.create({
        nome: values.nome.trim(),
        data_nascimento: brToIso(values.data_nascimento) ?? ''
      })
      const notice: FlashNotice = {
        tone: 'success',
        message: 'Paciente criado. Preencha os demais dados no seu ritmo: cada bloco é salvo separadamente.'
      }
      navigate(`/pacientes/${patient.id}/editar`, { state: { notice } })
    } catch (error) {
      const err = normalizeError(error)
      Object.entries(err.fieldErrors ?? {}).forEach(([field, message]) => {
        if (field === 'nome' || field === 'data_nascimento') setError(field, { message })
      })
      setServerError(err.message)
    }
  })

  return (
    <Modal open={open} onClose={onClose} labelledBy="new-patient-title" className="max-w-[440px] p-7">
      <span className="inline-block rounded-md bg-brand-100 px-2 py-1 text-[10px] font-bold tracking-wide text-brand-700 uppercase">
        Cadastrar paciente
      </span>
      <h2 id="new-patient-title" className="mt-3 text-title font-semibold text-ink">Novo paciente</h2>
      <p className="mt-1.5 text-body text-muted">Telefone, CPF, endereço e responsáveis você completa na ficha do paciente.</p>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        <TextField label="Nome completo *" placeholder="Nome completo do paciente" autoComplete="off" autoFocus error={errors.nome?.message} {...register('nome')} />
        <TextField
          label="Data de nascimento *" placeholder="DD/MM/AAAA" inputMode="numeric" autoComplete="off" error={errors.data_nascimento?.message}
          {...register('data_nascimento', { onChange: (e) => (e.target.value = maskDate(e.target.value)) })}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>
            <UserPlus className="size-4" aria-hidden /> Criar paciente
          </Button>
        </div>
      </form>
    </Modal>
  )
}
