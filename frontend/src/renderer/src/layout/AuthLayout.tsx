import type { ReactNode } from 'react'
import { BrandLogo } from '@/shared/components/BrandLogo'
import { cn } from '@/shared/lib/cn'

interface AuthLayoutProps {
  badge: string
  headline: string
  description: string
  cardWidth?: 'md' | 'lg'
  children: ReactNode
}

/** Estrutura das telas públicas: painel azul à esquerda + cartão do formulário à direita. */
export function AuthLayout({ badge, headline, description, cardWidth = 'md', children }: AuthLayoutProps) {
  return (
    <main className="flex h-full bg-surface">
      <aside className="relative hidden w-[40%] max-w-[520px] min-w-[340px] flex-col overflow-hidden bg-linear-to-b from-brand-900 via-brand-700 to-cyan-brand p-12 text-white md:flex">
        <div aria-hidden className="absolute -top-28 -right-28 size-[420px] rounded-full bg-white/10" />
        <div aria-hidden className="absolute -bottom-32 -left-28 size-[420px] rounded-full border border-white/25" />
        <div aria-hidden className="absolute right-[22%] bottom-[24%] size-4 rounded-full bg-mint" />

        <BrandLogo className="relative" />

        <div className="relative my-auto max-w-[400px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-caption font-semibold uppercase">
            <span className="size-1.5 rounded-full bg-mint" aria-hidden />
            {badge}
          </span>
          <h2 className="mt-5 text-display leading-[1.1] font-bold">{headline}</h2>
          <p className="mt-4 text-lead leading-relaxed text-white/85">{description}</p>
        </div>
      </aside>

      <section className="flex flex-1 items-center justify-center overflow-y-auto p-8">
        <div className={cn('w-full rounded-3xl border border-line bg-surface p-8 shadow-[0_24px_60px_-32px_rgba(15,31,61,0.35)]', cardWidth === 'lg' ? 'max-w-[490px]' : 'max-w-[434px]')}>
          {children}
        </div>
      </section>
    </main>
  )
}
