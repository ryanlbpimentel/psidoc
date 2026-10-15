import { Navigate, useOutletContext, useParams } from 'react-router-dom'
import type { PatientOutletContext } from './PatientShell'

const TITLES: Record<string, string> = {
  anamnese: 'Anamnese',
  evolucao: 'Evolução',
  financeiro: 'Financeiro',
  anexos: 'Anexos'
}

/** Abas da ficha que ainda não foram implementadas. */
export function PatientSoonPage() {
  const { aba = '' } = useParams()
  const { patient } = useOutletContext<PatientOutletContext>()
  const title = TITLES[aba]
  if (!title) return <Navigate to={`/pacientes/${patient.id}`} replace />
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <p className="text-body font-semibold text-ink">{title}</p>
      <p className="mt-1 text-body text-muted">Esta área ainda não foi implementada.</p>
    </div>
  )
}
