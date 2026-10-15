import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { PasswordField } from '@/shared/components/ui/TextField'
import { isFemale } from '../constants'
import { deletePatientSchema, type DeletePatientValues } from '../schemas'
import { patientsService } from '../services/patients.service'
import type { FlashNotice, Patient } from '../types'

/** Exclusão definitiva: só de paciente arquivado, e pede a senha de quem está logado. */
export function DeleteDialog({ patient, open, onClose }: { patient: Patient; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const f = isFemale(patient)
  const {
    register, handleSubmit, reset, setError, watch,
    formState: { errors, isSubmitting }
  } = useForm<DeletePatientValues>({ resolver: zodResolver(deletePatientSchema), defaultValues: { senha: '', confirmar: false } })

  useEffect(() => {
    if (open) {
      reset({ senha: '', confirmar: false })
      setServerError(null)
    }
  }, [open, reset])

  const ready = watch('senha').length > 0 && watch('confirmar')

  const onSubmit = handleSubmit(async ({ senha }) => {
    setServerError(null)
    try {
      await patientsService.remove(patient.id, senha)
      const notice: FlashNotice = { tone: 'success', message: `${patient.nome} foi excluíd${f ? 'a' : 'o'} permanentemente.` }
      navigate('/pacientes/arquivados', { state: { notice } })
    } catch (error) {
      const err = normalizeError(error)
      if (err.code === 'INVALID_PASSWORD' || err.fieldErrors?.senha) setError('senha', { message: err.fieldErrors?.senha ?? 'Senha incorreta' })
      else setServerError(err.message)
    }
  })

  return (
    <Modal open={open} onClose={isSubmitting ? () => undefined : onClose} labelledBy="delete-title" className="max-w-[460px]">
      <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-danger">
        <Trash2 className="size-5" aria-hidden />
      </div>
      <h2 id="delete-title" className="mt-4 text-lead font-semibold text-ink">Excluir {patient.nome}?</h2>
      <p className="mt-1.5 text-body text-muted">
        Diferente do arquivamento, a exclusão remove o cadastro e seus registros de forma permanente. Esta ação é irreversível.
      </p>

      <div className="mt-4 rounded-xl bg-rose-50 px-3.5 py-3">
        <p className="text-body font-semibold text-danger">Verifique antes de excluir</p>
        <p className="mt-1 text-caption leading-relaxed text-danger/90">
          Antes de prosseguir, confira as obrigações aplicáveis de guarda dos registros e a necessidade de preservar essas
          informações. Se precisar manter o histórico, cancele e mantenha {f ? 'a' : 'o'} paciente arquivad{f ? 'a' : 'o'}.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3.5">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        <p className="text-caption text-muted">Para confirmar sua identidade, informe a senha cadastrada no seu login.</p>
        <PasswordField label="Sua senha *" placeholder="••••••••" autoComplete="current-password" error={errors.senha?.message} {...register('senha')} />
        <label className="flex cursor-pointer items-start gap-2.5 text-caption text-ink">
          <input type="checkbox" className="mt-0.5 size-4 cursor-pointer accent-brand-700" {...register('confirmar')} />
          <span>Confirmo que desejo excluir {patient.nome} e compreendo que a exclusão não poderá ser desfeita.</span>
        </label>
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" variant="danger" loading={isSubmitting} disabled={!ready}>Excluir paciente</Button>
        </div>
      </form>
    </Modal>
  )
}
