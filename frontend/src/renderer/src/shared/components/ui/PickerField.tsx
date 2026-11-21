import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface PickerFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  type: 'date' | 'time'
  error?: string
}

/** Campo de data/hora nativo (abre o seletor do sistema) com o ícone do design. */
export const PickerField = forwardRef<HTMLInputElement, PickerFieldProps>(function PickerField(
  { label, type, error, className, id, ...props },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const Icon = type === 'date' ? CalendarDays : Clock
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-body font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'relative h-11 w-full rounded-xl border border-line bg-slate-50 px-3.5 pr-10 text-body text-ink outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20',
            '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        />
        <Icon aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink" />
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
