import { createContext, useContext, useEffect } from 'react'

export interface Crumb {
  label: string
  to?: string
}

export interface BreadcrumbValue {
  crumbs: Crumb[]
  setCrumbs: (crumbs: Crumb[]) => void
}

export const BreadcrumbContext = createContext<BreadcrumbValue | null>(null)

export const useCrumbs = () => useContext(BreadcrumbContext)?.crumbs ?? []

/** A página declara o seu caminho ("Pacientes > Nome") e a barra superior mostra. */
export function useBreadcrumbs(crumbs: Crumb[]) {
  const ctx = useContext(BreadcrumbContext)
  const key = JSON.stringify(crumbs)
  useEffect(() => {
    ctx?.setCrumbs(JSON.parse(key) as Crumb[])
    return () => ctx?.setCrumbs([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
