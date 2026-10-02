import { LogOut } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'

interface LogoutDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function LogoutDialog({ open, onCancel, onConfirm }: LogoutDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="logout-title">
      <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-danger">
        <LogOut className="size-5" aria-hidden />
      </div>
      <h2 id="logout-title" className="mt-5 text-lead font-semibold text-ink">
        Deseja encerrar sua sessão?
      </h2>
      <p className="mt-1.5 text-body text-muted">Você precisará informar seu e-mail e senha novamente para acessar o PSIDOC.</p>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>
          Sair <LogOut className="size-3.5" aria-hidden />
        </Button>
      </div>
    </Modal>
  )
}
