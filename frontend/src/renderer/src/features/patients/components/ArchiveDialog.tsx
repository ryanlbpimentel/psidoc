import { useState } from 'react'
import { Archive } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { normalizeError } from '@/core/http/errors'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Notice } from '@/shared/components/ui/Notice'
import { isFemale } from '../constants'
import { patientsService } from '../services/patients.service'
import type { FlashNotice, Patient } from '../types'

export function ArchiveDialog({ patient, open, onClose }: { patient: Patient; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const f = isFemale(patient)

  const confirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await patientsService.archive(patient.id)
      const notice: FlashNotice = {
        tone: 'success',
        message: `${patient.nome} foi arquivad${f ? 'a' : 'o'}. Seus dados e histórico foram preservados.`
      }
      navigate('/pacientes/arquivados', { state: { notice, archivedFirstName: patient.nome.split(' ')[0] } })
    } catch (e) {
      setError(normalizeError(e).message)
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={loading ? () => undefined : onClose} labelledBy="archive-title" className="max-w-[420px]">
      <div className="flex size-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Archive className="size-5" aria-hidden />
      </div>
      <h2 id="archive-title" className="mt-4 text-lead font-semibold text-ink">Arquivar {patient.nome}?</h2>
      <p className="mt-1.5 text-body text-muted">
        {f ? 'A' : 'O'} paciente deixará a lista de pacientes ativos e poderá ser consultad{f ? 'a' : 'o'} em Pacientes arquivados.
      </p>
      <Notice tone="info" className="mt-4 bg-brand-100/60">
        Arquivar não exclui os dados nem o histórico. As informações serão preservadas para consulta.
      </Notice>
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={confirm} loading={loading}>
          <Archive className="size-4" aria-hidden /> Arquivar paciente
        </Button>
      </div>
    </Modal>
  )
}
