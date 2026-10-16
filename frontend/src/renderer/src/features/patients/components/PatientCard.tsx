import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { formatSession } from '@/shared/lib/date'
import { FINANCE_LABEL } from '../constants'
import type { FinanceStatus, Patient } from '../types'

const FINANCE_STYLE: Record<FinanceStatus, string> = {
  EM_DIA: 'bg-emerald-50 text-emerald-700',
  PENDENTE: 'bg-amber-50 text-orange-600',
  ATRASADO: 'bg-red-50 text-danger'
}

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_8px_24px_-18px_rgba(5,58,133,0.35)]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lead font-semibold text-brand-700">
          {patient.nome[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lead font-semibold text-ink">{patient.nome}</h2>
          <p className="text-caption font-medium text-emerald-700">Paciente ativo</p>
        </div>
      </div>

      {/* Agenda e financeiro ainda não existem no back: só aparecem se a API mandar esses campos. */}
      {(patient.proxima_sessao !== undefined || patient.financeiro) && (
        <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-caption">
          {patient.proxima_sessao !== undefined && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted">Próxima sessão</dt>
              <dd className="font-semibold text-ink">{patient.proxima_sessao ? formatSession(patient.proxima_sessao) : 'Sem agendamento'}</dd>
            </div>
          )}
          {patient.financeiro && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted">Financeiro</dt>
              <dd>
                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', FINANCE_STYLE[patient.financeiro])}>
                  {FINANCE_LABEL[patient.financeiro]}
                </span>
              </dd>
            </div>
          )}
        </dl>
      )}

      <Link
        to={`/pacientes/${patient.id}`}
        className="mt-4 flex items-center justify-between border-t border-line pt-3.5 text-body font-semibold text-brand-700 hover:underline"
      >
        Ver ficha do paciente <ArrowRight className="size-4" aria-hidden />
      </Link>
    </article>
  )
}
