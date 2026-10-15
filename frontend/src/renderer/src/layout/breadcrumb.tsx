import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BreadcrumbContext, useCrumbs, type Crumb } from './breadcrumbContext'

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  const value = useMemo(() => ({ crumbs, setCrumbs }), [crumbs])
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export function Breadcrumbs() {
  const crumbs = useCrumbs()
  if (crumbs.length === 0) return null
  return (
    <nav aria-label="Você está em" className="flex items-center gap-1.5 text-caption">
      {crumbs.map((crumb, i) => {
        const last = i === crumbs.length - 1
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3 text-muted" aria-hidden />}
            {crumb.to && !last ? (
              <Link to={crumb.to} className="text-muted hover:text-ink hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current={last ? 'page' : undefined} className={last ? 'font-semibold text-brand-700' : 'text-muted'}>
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
