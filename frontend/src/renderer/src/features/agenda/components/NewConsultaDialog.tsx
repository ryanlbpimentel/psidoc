import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarPlus, Clock, MapPin, X } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { PickerField } from '@/shared/components/ui/PickerField'
import { TextField } from '@/shared/components/ui/TextField'
import { consultaSchema, type ConsultaValues } from '../schemas'
import { consultaService } from '../services/consulta.service'
import { describeConflict, type ConflictInfo } from '../lib/conflict'
import { addMinutesIso, combineToIso, DURACAO_PADRAO_MIN, fmtTime } from '../lib/time'
import type { Consulta } from '../types'
import { PatientCombobox } from './PatientCombobox'

interface NewConsultaDialogProps {
  open: boolean
  defaultDate: string // AAAA-MM-DD
  onClose: () => void
  onCreated: (consulta: Consulta) => void
}

export function NewConsultaDialog({ open, defaultDate, onClose, onCreated }: NewConsultaDialogProps) {
  const [conflict, setConflict] = useState<ConflictInfo | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register, control, handleSubmit, reset, watch,
    formState: { errors, isSubmitting }
  } = useForm<ConsultaValues>({
    resolver: zodResolver(consultaSchema),
    defaultValues: { paciente: null, data: defaultDate, hora: '', local: '' }
  })

  useEffect(() => {
    if (open) {
      reset({ paciente: null, data: defaultDate, hora: '', local: '' })
      setConflict(null)
      setServerError(null)
    }
  }, [open, defaultDate, reset])

  const [data, hora] = watch(['data', 'hora'])
  const endLabel = data && hora ? fmtTime(addMinutesIso(combineToIso(data, hora), DURACAO_PADRAO_MIN)) : null
  const hasErrors = Object.keys(errors).length > 0

  const onSubmit = handleSubmit(async (values) => {
    setConflict(null)
    setServerError(null)
    if (!values.paciente) return
    const inicio = combineToIso(values.data, values.hora)
    try {
      const created = await consultaService.schedule({ pacienteId: values.paciente.id, inicio, local: values.local.trim() })
      onCreated({ ...created, paciente: { nome: values.paciente.nome } })
      onClose()
    } catch (error) {
      const err = normalizeError(error)
      if (err.status === 409) setConflict(await describeConflict(inicio, err.message))
      else setServerError(err.message)
    }
  })

  const close = () => !isSubmitting && onClose()

  return (
    <Modal open={open} onClose={close} labelledBy="new-consulta-title" className="max-w-[500px]">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <CalendarPlus className="size-5" aria-hidden />
        </span>
        <h2 id="new-consulta-title" className="flex-1 text-lead font-bold text-ink">Nova consulta</h2>
        <button type="button" onClick={close} aria-label="Fechar janela" className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-4 text-body text-muted">Informe o paciente, o início e o local do atendimento.</p>
      <p className="mt-0.5 text-caption text-muted">* Campos obrigatórios</p>

      <form onSubmit={onSubmit} noValidate className="mt-3 space-y-4">
        <Controller
          control={control}
          name="paciente"
          render={({ field }) => <PatientCombobox value={field.value} onChange={field.onChange} error={errors.paciente?.message} />}
        />
        <div className="grid grid-cols-2 gap-3">
          <PickerField label="Data de início *" type="date" error={errors.data?.message} {...register('data')} />
          <PickerField label="Hora de início *" type="time" error={errors.hora?.message} {...register('hora')} />
        </div>
        <TextField label="Local *" placeholder="Informe o local" trailing={<MapPin className="size-4 text-ink" aria-hidden />} error={errors.local?.message} {...register('local')} />

        <Notice tone="info" icon={Clock} className="bg-brand-100/60 text-slate-600">
          <p className="font-semibold text-brand-900">Duração inicial: {DURACAO_PADRAO_MIN} minutos</p>
          <p>{endLabel ? `Término previsto: ${endLabel} · calculado a partir do início` : 'Informe o início para calcular o término.'}</p>
        </Notice>

        {conflict && (
          <Notice tone="error">
            <p className="font-semibold">{conflict.title}</p>
            <p>{conflict.detail}</p>
          </Notice>
        )}
        {serverError && <Notice tone="error">{serverError}</Notice>}
        {hasErrors && !conflict && !serverError && <span className="sr-only" role="alert">Preencha os campos indicados para continuar.</span>}

        <div className="flex justify-end gap-2.5 border-t border-line pt-4">
          <Button variant="outline" onClick={close} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>Agendar consulta</Button>
        </div>
      </form>
    </Modal>
  )
}
