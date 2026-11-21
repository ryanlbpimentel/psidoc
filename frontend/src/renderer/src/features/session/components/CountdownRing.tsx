import { cn } from '@/shared/lib/cn'
import { fmtCountdown } from '@/features/agenda/lib/time'

interface CountdownRingProps {
  remainingMs: number
  totalMs: number
  alert: boolean
}

/** Relógio da sessão: o arco mostra a fração de tempo que ainda resta. */
export function CountdownRing({ remainingMs, totalMs, alert }: CountdownRingProps) {
  const radius = 84
  const circumference = 2 * Math.PI * radius
  const fraction = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0
  return (
    <div className="relative size-[200px]" role="timer" aria-label={`${fmtCountdown(remainingMs)} minutos restantes`}>
      <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="8" className="stroke-slate-200" />
        <circle
          cx="100" cy="100" r={radius} fill="none" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${fraction * circumference} ${circumference}`}
          className={cn('transition-[stroke-dasharray] duration-1000 ease-linear', alert ? 'stroke-amber-700' : 'stroke-brand-700')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-[40px] leading-none font-bold tabular-nums', alert ? 'text-amber-700' : 'text-brand-900')}>{fmtCountdown(remainingMs)}</span>
        <span className="mt-2 text-caption text-muted">minutos restantes</span>
      </div>
    </div>
  )
}
