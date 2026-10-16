import { useEffect, useState } from 'react'
import { getErrorMessage } from '@/core/http/errors'
import { patientsService } from './services/patients.service'
import type { Address, Guardian } from './types'

/** Endereço e responsáveis do paciente (no back são consultas separadas). */
export function usePatientDetails(patientId: string) {
  const [address, setAddress] = useState<Address | null>(null)
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([patientsService.getAddress(patientId), patientsService.listGuardians(patientId)])
      .then(([a, g]) => {
        if (cancelled) return
        setAddress(a)
        setGuardians(g)
        setError(null)
      })
      .catch((e) => !cancelled && setError(getErrorMessage(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [patientId])

  return { address, setAddress, guardians, setGuardians, loading, error }
}
