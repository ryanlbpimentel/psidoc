import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { durationMin, fmtRange, isOngoing } from '../lib/time'
import type { Consulta } from '../types'

interface ConsultaRowProps {
  consulta: Consulta
  now: number
  highlighted?: boolean
  onReminder: (consulta: Consulta) => void
}

export function ConsultaRow({ consulta, now, highlighted, onReminder }: ConsultaRowProps) {
  const ongoing = isOngoing(consulta, now)
  return (
    <li
      className={cn(
        'flex items-center gap-4 rounded-2xl border bg-surface px-5 py-3.5 transition-colors',
        highlighted ? 'border-brand-700/40 bg-brand-100/50' : 'border-line'
      )}
    >
      <div className="w-[108px] shrink-0">
        <p className="text-body font-bold text-brand-700">{fmtRange(consulta)}</p>
        <p className="text-caption text-muted">{durationMin(consulta)} minutos</p>
      </div>
      <span aria-hidden className="h-9 w-px shrink-0 bg-line" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-bold text-ink">{consulta.paciente.nome}</p>
        <p className="truncate text-caption text-muted">{consulta.local}</p>
      </div>
      {ongoing && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-caption font-medium text-emerald-700">Em andamento</span>}
      <Button variant="outline" size="sm" onClick={() => onReminder(consulta)} className="shrink-0">
        <MessageCircle className="size-4" aria-hidden /> Enviar lembrete
      </Button>
      <Link
        to={ongoing ? '/sessao' : `/pacientes/${consulta.id_paciente}`}
        className="flex w-[104px] shrink-0 items-center justify-end gap-1 text-body font-semibold text-brand-700 hover:underline"
      >
        {ongoing ? 'Ver sessão' : 'Ver detalhes'} <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </li>
  )
}
