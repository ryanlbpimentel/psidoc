import { useCallback, useEffect, useState } from 'react'
import { Navigate, useLocation, useOutletContext } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { AddressEditor } from '../components/AddressEditor'
import { GuardiansEditor } from '../components/GuardiansEditor'
import { PersonalDataEditor } from '../components/PersonalDataEditor'
import { usePatientDetails } from '../usePatientDetails'
import type { FlashNotice } from '../types'
import type { PatientOutletContext } from './PatientShell'

/** Edição: cada bloco (dados pessoais, endereço, responsáveis) é salvo de forma independente. */
export function PatientRecordEdit() {
  const { patient, setPatient, setDirtySections, requestLeave } = useOutletContext<PatientOutletContext>()
  const notice = (useLocation().state as { notice?: FlashNotice } | null)?.notice
  const { address, setAddress, guardians, setGuardians, loading, error } = usePatientDetails(patient.id)
  const [personalDirty, setPersonalDirty] = useState(false)
  const [addressDirty, setAddressDirty] = useState(false)

  useEffect(() => {
    const sections: string[] = []
    if (personalDirty) sections.push('Dados pessoais')
    if (addressDirty) sections.push('Endereço')
    setDirtySections(sections)
  }, [personalDirty, addressDirty, setDirtySections])
  useEffect(() => () => setDirtySections([]), [setDirtySections])

  const onPersonalDirty = useCallback((dirty: boolean) => setPersonalDirty(dirty), [])
  const onAddressDirty = useCallback((dirty: boolean) => setAddressDirty(dirty), [])

  // Paciente arquivado é somente leitura.
  if (patient.status !== 'ATIVO') return <Navigate to={`/pacientes/${patient.id}`} replace />
  if (loading) return <p className="text-body text-muted">Carregando dados do paciente…</p>

  const anyDirty = personalDirty || addressDirty

  return (
    <div className="space-y-5">
      {notice && <Notice tone={notice.tone}>{notice.message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <PersonalDataEditor patient={patient} onSaved={setPatient} onDirtyChange={onPersonalDirty} />
      <AddressEditor patientId={patient.id} address={address} onSaved={setAddress} onDirtyChange={onAddressDirty} />
      <GuardiansEditor patient={patient} guardians={guardians} hasAddress={address !== null} onChange={setGuardians} />

      <div>
        <Button variant="outline" onClick={() => requestLeave(`/pacientes/${patient.id}`)}>
          {anyDirty ? 'Cancelar e voltar' : 'Voltar para a ficha'}
        </Button>
      </div>
    </div>
  )
}
