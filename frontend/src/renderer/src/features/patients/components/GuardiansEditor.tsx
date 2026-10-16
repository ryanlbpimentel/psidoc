import { useState } from 'react'
import { Pencil, Plus, Users } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Notice } from '@/shared/components/ui/Notice'
import { isoToBr } from '@/shared/lib/date'
import { maskPhone } from '@/shared/lib/masks'
import { initials } from '@/shared/lib/format'
import { MAX_GUARDIANS, kinshipLabel } from '../constants'
import type { Guardian, Patient } from '../types'
import { GuardianDialog } from './GuardianDialog'
import { SectionCard } from './SectionCard'

interface Props {
  patient: Patient
  guardians: Guardian[]
  /** O back só aceita responsável depois que o endereço do paciente está salvo. */
  hasAddress: boolean
  onChange: (guardians: Guardian[]) => void
}

export function GuardiansEditor({ patient, guardians, hasAddress, onChange }: Props) {
  const [dialog, setDialog] = useState<{ guardian: Guardian | null } | null>(null)
  const full = guardians.length >= MAX_GUARDIANS
  const blocked = !hasAddress || full

  const close = () => setDialog(null)

  return (
    <SectionCard
      title="Responsáveis legais"
      description={`${guardians.length} / ${MAX_GUARDIANS} responsáveis cadastrados. Preencha quando houver responsável legal, especialmente para pacientes menores de idade. Máximo ${MAX_GUARDIANS} responsáveis.`}
    >
      {guardians.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-slate-50 px-4 py-8 text-muted">
          <Users className="size-6" aria-hidden />
          <p className="text-body">Nenhum responsável cadastrado</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {guardians.map((g, i) => (
            <li key={g.id} className="flex items-center gap-3 rounded-xl border border-line bg-slate-50/60 px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-body font-semibold text-brand-700">
                {initials(g.nome, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold text-ink">
                  Responsável {i + 1} · {g.nome}
                </p>
                <p className="truncate text-caption text-muted">
                  {kinshipLabel(g.parentesco)} · {maskPhone(g.telefone)} · {g.email} · nasc. {isoToBr(g.data_nascimento)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDialog({ guardian: g })}>
                <Pencil className="size-3.5" aria-hidden /> Editar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!hasAddress && (
        <Notice tone="warning" className="mt-4">
          Para adicionar um responsável, primeiro complete e salve todos os campos obrigatórios do endereço (incluindo o CEP).
        </Notice>
      )}
      {hasAddress && full && (
        <Notice tone="info" className="mt-4">Limite de {MAX_GUARDIANS} responsáveis atingido. Para incluir outro, exclua um dos cadastrados.</Notice>
      )}

      <Button variant="outline" className="mt-4 w-full" disabled={blocked} onClick={() => setDialog({ guardian: null })}>
        <Plus className="size-4" aria-hidden /> Adicionar responsável
      </Button>

      <GuardianDialog
        patient={patient}
        guardian={dialog?.guardian ?? null}
        open={dialog !== null}
        onClose={close}
        onSaved={(saved) => {
          onChange(guardians.some((g) => g.id === saved.id) ? guardians.map((g) => (g.id === saved.id ? saved : g)) : [...guardians, saved])
          close()
        }}
        onDeleted={(id) => {
          onChange(guardians.filter((g) => g.id !== id))
          close()
        }}
      />
    </SectionCard>
  )
}
