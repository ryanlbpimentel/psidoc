import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, UserPlus } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { SelectField } from '@/shared/components/ui/SelectField'
import { TextField } from '@/shared/components/ui/TextField'
import { maskCpf, maskDate, maskPhone } from '@/shared/lib/masks'
import { KINSHIP_OPTIONS } from '../constants'
import { guardianPayload, toGuardianForm } from '../mappers'
import { guardianSchema, type GuardianValues } from '../schemas'
import { patientsService } from '../services/patients.service'
import type { Guardian, Patient } from '../types'

interface GuardianDialogProps {
  patient: Patient
  /** null = novo responsável; senão, edição. */
  guardian: Guardian | null
  open: boolean
  onClose: () => void
  onSaved: (guardian: Guardian) => void
  onDeleted: (guardianId: string) => void
}

const FIELDS = ['nome', 'data_nascimento', 'cpf', 'telefone', 'email', 'parentesco'] as const

/** Modal para adicionar, editar e excluir responsável legal (o endereço é o do paciente). */
export function GuardianDialog({ patient, guardian, open, onClose, onSaved, onDeleted }: GuardianDialogProps) {
  const editing = guardian !== null
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const {
    register, handleSubmit, reset, setError,
    formState: { errors, isSubmitting }
  } = useForm<GuardianValues>({ resolver: zodResolver(guardianSchema), defaultValues: toGuardianForm(guardian) })

  useEffect(() => {
    if (open) {
      reset(toGuardianForm(guardian))
      setServerError(null)
      setConfirmingDelete(false)
    }
  }, [open, guardian, reset])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const dto = guardianPayload(values)
      const saved = guardian
        ? await patientsService.updateGuardian(patient.id, guardian.id, dto)
        : await patientsService.createGuardian(patient.id, dto)
      onSaved(saved)
    } catch (error) {
      const err = normalizeError(error)
      Object.entries(err.fieldErrors ?? {}).forEach(([field, message]) => {
        if ((FIELDS as readonly string[]).includes(field)) setError(field as (typeof FIELDS)[number], { message })
      })
      setServerError(err.message)
    }
  })

  const confirmDelete = async () => {
    if (!guardian) return
    setDeleting(true)
    setServerError(null)
    try {
      await patientsService.removeGuardian(patient.id, guardian.id)
      onDeleted(guardian.id)
    } catch (error) {
      setServerError(normalizeError(error).message)
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const busy = isSubmitting || deleting

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} labelledBy="guardian-title" className="max-w-[560px] p-7">
      {confirmingDelete && guardian ? (
        <>
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-danger">
            <Trash2 className="size-5" aria-hidden />
          </div>
          <h2 id="guardian-title" className="mt-4 text-lead font-semibold text-ink">Excluir {guardian.nome}?</h2>
          <p className="mt-1.5 text-body text-muted">
            Este responsável será removido do cadastro de {patient.nome}. Os dados do paciente não são afetados.
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={deleting}>Voltar</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>Excluir responsável</Button>
          </div>
        </>
      ) : (
        <>
          <h2 id="guardian-title" className="text-title font-semibold text-ink">{editing ? 'Editar responsável' : 'Adicionar responsável'}</h2>
          <p className="mt-1 text-body text-muted">Responsável legal de {patient.nome}. Todos os campos são obrigatórios.</p>

          <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
            {serverError && <Notice tone="error">{serverError}</Notice>}
            <TextField label="Nome completo *" placeholder="Nome do responsável" autoComplete="off" error={errors.nome?.message} {...register('nome')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Data de nascimento *" placeholder="DD/MM/AAAA" inputMode="numeric" autoComplete="off" error={errors.data_nascimento?.message}
                {...register('data_nascimento', { onChange: (e) => (e.target.value = maskDate(e.target.value)) })}
              />
              <TextField
                label="CPF *" placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" error={errors.cpf?.message}
                {...register('cpf', { onChange: (e) => (e.target.value = maskCpf(e.target.value)) })}
              />
              <TextField
                label="Telefone *" placeholder="(00) 00000-0000" inputMode="tel" autoComplete="off" error={errors.telefone?.message}
                {...register('telefone', { onChange: (e) => (e.target.value = maskPhone(e.target.value)) })}
              />
              <TextField label="E-mail *" type="email" placeholder="nome@email.com" autoComplete="off" error={errors.email?.message} {...register('email')} />
            </div>
            <SelectField label="Parentesco *" placeholder="Selecionar parentesco" options={KINSHIP_OPTIONS} error={errors.parentesco?.message} {...register('parentesco')} />
            <Notice tone="info" className="bg-brand-100/60">O endereço do responsável será o mesmo do paciente.</Notice>

            <div className="flex items-center justify-between gap-2.5 pt-1">
              {editing ? (
                <Button variant="ghost" className="text-danger hover:bg-rose-50" onClick={() => setConfirmingDelete(true)} disabled={busy}>
                  <Trash2 className="size-4" aria-hidden /> Excluir
                </Button>
              ) : <span />}
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
                <Button type="submit" loading={isSubmitting}>
                  <UserPlus className="size-4" aria-hidden /> {editing ? 'Salvar alterações' : 'Adicionar responsável'}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </Modal>
  )
}
