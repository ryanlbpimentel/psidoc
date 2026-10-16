import { FileWarning } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'

interface DiscardDialogProps {
  open: boolean
  sections: string[]
  onKeepEditing: () => void
  onDiscard: () => void
}

export function DiscardDialog({ open, sections, onKeepEditing, onDiscard }: DiscardDialogProps) {
  const list = sections.join(' e ').toLowerCase()
  return (
    <Modal open={open} onClose={onKeepEditing} labelledBy="discard-title" className="max-w-[420px]">
      <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-danger">
        <FileWarning className="size-5" aria-hidden />
      </div>
      <h2 id="discard-title" className="mt-4 text-lead font-semibold text-ink">Descartar alterações?</h2>
      <p className="mt-1.5 text-body text-muted">
        Você alterou {list ? `os campos de ${list}` : 'dados'} e ainda não salvou. Ao descartar, apenas as alterações não salvas
        serão perdidas; o que já foi salvo continua no cadastro.
      </p>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" onClick={onKeepEditing}>Continuar editando</Button>
        <Button variant="danger" onClick={onDiscard}>Descartar</Button>
      </div>
    </Modal>
  )
}
