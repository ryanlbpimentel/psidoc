import { Lock } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { Notice } from '@/shared/components/ui/Notice'
import { isoToBr } from '@/shared/lib/date'
import { maskCep, maskCpf, maskPhone, moneyFromNumber } from '@/shared/lib/masks'
import { ReadField, SectionCard } from '../components/SectionCard'
import { genderLabel, isFemale, kinshipLabel } from '../constants'
import { usePatientDetails } from '../usePatientDetails'
import type { PatientOutletContext } from './PatientShell'

/** Prontuário (antigo "Dados cadastrais") em modo de consulta, com os blocos um abaixo do outro. */
export function PatientRecordView() {
  const { patient, requestDelete } = useOutletContext<PatientOutletContext>()
  const { address, guardians, loading, error } = usePatientDetails(patient.id)
  const archived = patient.status === 'ARQUIVADO'
  const f = isFemale(patient)

  if (loading) return <p className="text-body text-muted">Carregando prontuário…</p>

  return (
    <div className="space-y-5">
      {error && <Notice tone="error">{error}</Notice>}
      {archived && (
        <Notice tone="info" icon={Lock} className="bg-brand-100/60">
          Paciente arquivad{f ? 'a' : 'o'}{patient.arquivado_em ? ` em ${isoToBr(patient.arquivado_em)}` : ''}. Cadastro preservado em modo somente leitura.
        </Notice>
      )}

      <SectionCard title="Dados pessoais">
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          <ReadField label="Nome completo" value={patient.nome} />
          <ReadField label="Data de nascimento" value={isoToBr(patient.data_nascimento)} />
          <ReadField label="CPF" value={patient.cpf ? maskCpf(patient.cpf) : null} />
          <ReadField label="Telefone" value={patient.telefone ? maskPhone(patient.telefone) : null} />
          <ReadField label="Gênero" value={genderLabel(patient.genero)} />
          <ReadField label="Renda familiar (R$)" value={patient.renda_familiar != null ? moneyFromNumber(patient.renda_familiar) : null} />
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <ReadField label="Observações / notas" value={patient.observacoes} />
        </div>
      </SectionCard>

      <SectionCard title="Endereço">
        {address ? (
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
            <ReadField label="Logradouro" value={address.logradouro} />
            <ReadField label="Número" value={address.numero} />
            <ReadField label="Complemento" value={address.complemento} />
            <ReadField label="Bairro" value={address.bairro} />
            <ReadField label="Município" value={address.municipio} />
            <ReadField label="UF" value={address.estado} />
            <ReadField label="CEP" value={maskCep(address.cep)} />
          </div>
        ) : (
          <p className="text-body text-muted">Endereço não cadastrado.{!archived && ' Selecione Editar dados para cadastrar.'}</p>
        )}
      </SectionCard>

      <SectionCard title="Responsáveis legais" description={`${guardians.length} / 3 responsáveis cadastrados`}>
        {guardians.length === 0 ? (
          <p className="text-body text-muted">Nenhum responsável legal cadastrado.</p>
        ) : (
          <ul className="space-y-2.5">
            {guardians.map((g, i) => (
              <li key={g.id} className="grid gap-x-6 gap-y-3 rounded-xl border border-line bg-slate-50/60 px-4 py-3.5 sm:grid-cols-4">
                <ReadField label={`Responsável ${i + 1}`} value={g.nome} />
                <ReadField label="Parentesco" value={kinshipLabel(g.parentesco)} />
                <ReadField label="Telefone" value={maskPhone(g.telefone)} />
                <ReadField label="E-mail" value={g.email} />
                <ReadField label="Data de nascimento" value={isoToBr(g.data_nascimento)} />
                <ReadField label="CPF" value={maskCpf(g.cpf)} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-muted">
        <span>
          {archived ? 'Cadastro arquivado · Disponível apenas para consulta' : 'Prontuário · Modo de consulta — cada bloco é salvo de forma independente.'}
        </span>
        {archived ? (
          <button type="button" onClick={requestDelete} className="cursor-pointer font-semibold text-danger hover:underline">
            Excluir paciente…
          </button>
        ) : (
          <span>Para alterar as informações, selecione Editar dados.</span>
        )}
      </div>
    </div>
  )
}
