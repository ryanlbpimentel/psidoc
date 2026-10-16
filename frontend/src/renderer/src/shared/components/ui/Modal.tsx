import { useEffect, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, labelledBy, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 p-6 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('max-h-[calc(100vh-3rem)] w-full max-w-[380px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl', className)}
      >
        {children}
      </div>
    </div>
  )
}
