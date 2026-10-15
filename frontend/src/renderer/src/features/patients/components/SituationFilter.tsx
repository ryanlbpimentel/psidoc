import { ChevronDown, Funnel } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** "Situação: Ativos / Arquivados" — trocar a opção leva para a outra lista. */
export function SituationFilter({ value }: { value: 'ATIVO' | 'ARQUIVADO' }) {
  const navigate = useNavigate()
  return (
    <label className="relative">
      <span className="sr-only">Filtrar por situação</span>
      <Funnel className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden />
      <select
        value={value}
        onChange={(e) => navigate(e.target.value === 'ARQUIVADO' ? '/pacientes/arquivados' : '/pacientes')}
        className="h-11 cursor-pointer appearance-none rounded-xl border border-line bg-white pr-9 pl-10 text-body font-medium outline-none focus:border-brand-700"
      >
        <option value="ATIVO">Situação: Ativos</option>
        <option value="ARQUIVADO">Situação: Arquivados</option>
      </select>
    </label>
  )
}
