import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  placeholder?: string
  options: { value: string; label: string }[]
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, placeholder, options, className, id, ...props },
  ref
) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-body font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cn(
            'h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-slate-50 pr-10 pl-3.5 text-body text-ink outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
      </div>
      {error && (
        <p id={`${selectId}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
