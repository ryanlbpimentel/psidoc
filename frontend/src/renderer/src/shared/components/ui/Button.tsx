import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-body font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-brand-700 text-white shadow-[0_10px_24px_-10px_rgba(10,92,168,0.7)] hover:bg-brand-600',
        outline: 'border border-line bg-white text-brand-700 hover:bg-brand-100',
        danger: 'bg-danger text-white hover:bg-red-800',
        ghost: 'text-brand-700 hover:bg-brand-100'
      },
      size: { md: 'h-11 px-5', sm: 'h-9 px-3.5 text-caption' }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, disabled, children, type = 'button', ...props },
  ref
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})
