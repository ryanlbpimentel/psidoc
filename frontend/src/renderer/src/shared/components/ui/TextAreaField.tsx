import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, className, id, ...props },
  ref
) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <div className="space-y-1.5">
      <label htmlFor={areaId} className="block text-body font-medium text-ink">
        {label}
      </label>
      <textarea
        ref={ref}
        id={areaId}
        rows={3}
        aria-invalid={!!error}
        aria-describedby={error ? `${areaId}-error` : undefined}
        className={cn(
          'w-full resize-none rounded-xl border border-line bg-slate-50 px-3.5 py-2.5 text-body text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${areaId}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
