import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: LucideIcon
  trailing?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, icon: Icon, trailing, className, id, ...props },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-body font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'h-11 w-full rounded-xl border border-line bg-slate-50 text-body text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20',
            Icon ? 'pl-10' : 'pl-3.5',
            trailing ? 'pr-11' : 'pr-3.5',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        />
        {trailing && <div className="absolute top-1/2 right-3 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export const PasswordField = forwardRef<HTMLInputElement, Omit<TextFieldProps, 'type' | 'icon' | 'trailing'>>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <TextField
        ref={ref}
        icon={Lock}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="cursor-pointer text-muted hover:text-ink"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        {...props}
      />
    )
  }
)
