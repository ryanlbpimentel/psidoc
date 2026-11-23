import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Layers, X } from 'lucide-react'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { TextField } from '@/shared/components/ui/TextField'
import { maskMoney, parseMoney } from '../lib/format'
import { pacoteSchema, type PacoteValues } from '../schemas'
import { financeiroService } from '../services/financeiro.service'
import type { Pacote } from '../types'

interface CadastrarPacoteDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (pacote: Pacote) => void
}

const EMPTY: PacoteValues = { quantidade: '', valor: '' }

export function CadastrarPacoteDialog({ open, onClose, onCreated }: CadastrarPacoteDialogProps) {
  const {
    register, control, handleSubmit, reset, setError,
    formState: { errors, isSubmitting }
  } = useForm<PacoteValues>({ resolver: zodResolver(pacoteSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await financeiroService.cadastrarPacote({ quantidade_sessoes: Number(values.quantidade), valor_total: parseMoney(values.valor) })
      onCreated(created)
      onClose()
    } catch (error) {
      setError('root', { message: normalizeError(error).message })
    }
  })

  const close = () => !isSubmitting && onClose()

  return (
    <Modal open={open} onClose={close} labelledBy="pacote-title" className="max-w-[500px]">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Layers className="size-5" aria-hidden />
        </span>
        <h2 id="pacote-title" className="flex-1 text-lead font-bold text-ink">Cadastrar pacote</h2>
        <button type="button" onClick={close} disabled={isSubmitting} aria-label="Fechar janela" className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-40">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-4 text-body text-muted">Informe a quantidade de sessões e o valor total do pacote.</p>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <TextField label="Quantidade de sessões *" inputMode="numeric" placeholder="Ex.: 4" error={errors.quantidade?.message} {...register('quantidade')} />
          {!errors.quantidade && <p className="mt-1.5 text-caption text-muted">Informe um número inteiro maior que zero.</p>}
        </div>
        <Controller
          control={control}
          name="valor"
          render={({ field }) => (
            <TextField
              label="Valor total do pacote (R$) *"
              inputMode="numeric"
              placeholder="R$ 0,00"
              error={errors.valor?.message}
              value={field.value}
              onChange={(e) => field.onChange(maskMoney(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <p className="text-caption text-muted">* Campos obrigatórios. Preencha ambos para cadastrar.</p>

        {errors.root && (
          <Notice tone="error">
            <p className="font-semibold">Não foi possível cadastrar o pacote</p>
            <p>{errors.root.message}</p>
          </Notice>
        )}

        <div className="flex justify-end gap-2.5 border-t border-line pt-4">
          <Button variant="outline" onClick={close} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" loading={isSubmitting}>Cadastrar pacote</Button>
        </div>
      </form>
    </Modal>
  )
}
