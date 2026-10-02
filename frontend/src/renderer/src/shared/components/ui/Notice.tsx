import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Clock, Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

const TONES = {
  success: { icon: CircleCheck, className: 'bg-emerald-50 text-emerald-800' },
  info: { icon: Info, className: 'bg-teal-50 text-slate-600' },
  warning: { icon: Clock, className: 'bg-amber-50 text-amber-800' },
  error: { icon: CircleAlert, className: 'bg-red-50 text-danger' }
} as const

interface NoticeProps {
  tone?: keyof typeof TONES
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

export function Notice({ tone = 'info', icon, children, className }: NoticeProps) {
  const Icon = icon ?? TONES[tone].icon
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-caption leading-relaxed', TONES[tone].className, className)}>
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
