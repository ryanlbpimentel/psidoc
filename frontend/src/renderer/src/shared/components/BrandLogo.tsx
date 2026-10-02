import logo from '@/assets/psidoc-logo.png'
import { cn } from '@/shared/lib/cn'

export function BrandLogo({ size = 'lg', className }: { size?: 'sm' | 'lg'; className?: string }) {
  const lg = size === 'lg'
  return (
    <div className={cn('flex items-center gap-3 text-white', className)}>
      <img src={logo} alt="" className={lg ? 'size-14' : 'size-9'} />
      <div className="leading-tight">
        <p className={cn('font-bold', lg ? 'text-xl' : 'text-lead')}>PSIDOC</p>
        <p className="text-caption tracking-wide text-white/85 uppercase">Gestão para psicólogos</p>
      </div>
    </div>
  )
}
