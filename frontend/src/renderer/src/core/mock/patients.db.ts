import type { Address, Guardian, Patient, PatientRecord } from '@/features/patients/types'

export interface DbPatient extends Patient {
  endereco: Address | null
  responsaveis: Guardian[]
  registros: PatientRecord[]
}

const KEY = 'psidoc:mock:patients'

// ═════════════════════════════════════════════════════════════════════════════
// DADOS DE DEMONSTRAÇÃO (só para ver as telas funcionando)
//
//   Ana Clara Monteiro   → ficha completa, endereço salvo, sem responsáveis (dá para adicionar)
//   Bruno Henrique Costa → ficha completa, financeiro pendente
//   Clarice Fontes       → só nome, nascimento e telefone: SEM endereço (adicionar responsável fica bloqueado)
//   Daniel Gouveia       → 13 anos, 3 responsáveis (limite atingido), financeiro atrasado
//   Eduardo Santoro      → sem CPF, sem endereço, sem sessão agendada
//   Gabriela Vasconcelos → 16 anos, 1 responsável
//   Helena Duarte e Lucas Azevedo → já arquivados (aparecem em "Pacientes arquivados")
//
// Para voltar a estes dados: localStorage.clear() no Console e recarregar (Ctrl+R).
// ═════════════════════════════════════════════════════════════════════════════

/** Data/hora relativa a hoje, para as sessões nunca ficarem no passado. */
const at = (daysFromNow: number, hhmm: string) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const NOTE_TEXT =
  'Paciente relata queixas de ansiedade generalizada associada a prazos corporativos. Em tratamento há 4 meses com evolução estável de regulação emocional.'

const records = (id: string): PatientRecord[] => [
  { id: `${id}-r1`, data_hora: at(-21, '14:00'), titulo: 'Observações clínicas / notas', tipo: 'OBSERVACAO', autor: 'Dra. Katia', autor_crp: '99/99999', local: 'Consultório Centro', conteudo: NOTE_TEXT },
  { id: `${id}-r2`, data_hora: at(-28, '14:00'), titulo: 'Registro do acompanhamento', tipo: 'ACOMPANHAMENTO', autor: 'Dra. Katia', autor_crp: '99/99999', local: 'Consultório Centro', conteudo: 'Sessão dedicada a técnicas de respiração e à organização da rotina de trabalho. Paciente relatou melhora na qualidade do sono ao longo da semana.' },
  { id: `${id}-r3`, data_hora: at(-35, '14:00'), titulo: 'Registro do acompanhamento', tipo: 'ACOMPANHAMENTO', autor: 'Dra. Katia', autor_crp: '99/99999', local: 'Consultório Centro', conteudo: 'Primeira sessão de acompanhamento. Combinados os objetivos do tratamento e a frequência semanal dos atendimentos.' }
]

const SEED: DbPatient[] = [
  {
    id: 'p-ana', nome: 'Ana Clara Monteiro', data_nascimento: '1998-04-12', cpf: '12345678900', telefone: '21987654321',
    genero: 'FEMININO', renda_familiar: 4200, observacoes: NOTE_TEXT, status: 'ATIVO',
    proxima_sessao: at(1, '14:00'), financeiro: 'EM_DIA',
    endereco: { logradouro: 'Rua Henrique de Novaes', numero: '120', complemento: null, bairro: 'Botafogo', municipio: 'Rio de Janeiro', estado: 'RJ', cep: '22281060' },
    responsaveis: [], registros: records('p-ana')
  },
  {
    id: 'p-bruno', nome: 'Bruno Henrique Costa', data_nascimento: '1990-09-03', cpf: '98765432100', telefone: '21991234567',
    genero: 'MASCULINO', renda_familiar: 6500, observacoes: 'Dificuldade para dormir e irritabilidade no trabalho.', status: 'ATIVO',
    proxima_sessao: at(1, '16:30'), financeiro: 'PENDENTE',
    endereco: { logradouro: 'Rua Voluntários da Pátria', numero: '45', complemento: 'Apto 302', bairro: 'Botafogo', municipio: 'Rio de Janeiro', estado: 'RJ', cep: '22270010' },
    responsaveis: [], registros: records('p-bruno')
  },
  {
    id: 'p-clarice', nome: 'Clarice Fontes', data_nascimento: '2001-11-22', telefone: '21988887777',
    genero: 'FEMININO', status: 'ATIVO', proxima_sessao: at(2, '14:00'), financeiro: 'EM_DIA',
    endereco: null, responsaveis: [], registros: records('p-clarice')
  },
  {
    id: 'p-daniel', nome: 'Daniel Gouveia', data_nascimento: '2013-02-18', cpf: '45612378900', telefone: '21977776666',
    genero: 'MASCULINO', observacoes: 'Encaminhado pela escola por dificuldades de concentração.', status: 'ATIVO',
    proxima_sessao: at(3, '09:00'), financeiro: 'ATRASADO',
    endereco: { logradouro: 'Rua das Laranjeiras', numero: '300', complemento: null, bairro: 'Laranjeiras', municipio: 'Rio de Janeiro', estado: 'RJ', cep: '22240003' },
    responsaveis: [
      { id: 'g-daniel-1', nome: 'Paulo Gouveia', data_nascimento: '1982-06-10', telefone: '21966665555', cpf: '11122233344', email: 'paulo.gouveia@email.com', parentesco: 'PAI' },
      { id: 'g-daniel-2', nome: 'Renata Gouveia', data_nascimento: '1984-03-25', telefone: '21955554444', cpf: '55566677788', email: 'renata.gouveia@email.com', parentesco: 'MAE' },
      { id: 'g-daniel-3', nome: 'Lúcia Gouveia', data_nascimento: '1955-12-01', telefone: '21944443333', cpf: '99988877766', email: 'lucia.gouveia@email.com', parentesco: 'AVOS' }
    ],
    registros: records('p-daniel')
  },
  {
    id: 'p-eduardo', nome: 'Eduardo Santoro', data_nascimento: '1985-07-30', telefone: '21933332222',
    genero: 'MASCULINO', status: 'ATIVO', proxima_sessao: null, financeiro: 'EM_DIA',
    endereco: null, responsaveis: [], registros: records('p-eduardo')
  },
  {
    id: 'p-gabriela', nome: 'Gabriela Vasconcelos', data_nascimento: '2010-05-09', cpf: '32165498700', telefone: '21922221111',
    genero: 'FEMININO', status: 'ATIVO', proxima_sessao: at(5, '11:00'), financeiro: 'EM_DIA',
    endereco: { logradouro: 'Avenida Atlântica', numero: '1500', complemento: 'Bloco B, apto 801', bairro: 'Copacabana', municipio: 'Rio de Janeiro', estado: 'RJ', cep: '22021000' },
    responsaveis: [
      { id: 'g-gabriela-1', nome: 'Maria Vasconcelos', data_nascimento: '1980-08-14', telefone: '21911110000', cpf: '78945612300', email: 'maria.vasconcelos@email.com', parentesco: 'MAE' }
    ],
    registros: records('p-gabriela')
  },
  {
    id: 'p-helena', nome: 'Helena Duarte', data_nascimento: '1985-08-03', telefone: '21900001111', genero: 'FEMININO',
    status: 'ARQUIVADO', arquivado_em: '2026-09-18T15:00:00.000Z', arquivado_por: 'Dra. Katia', proxima_sessao: null, financeiro: 'EM_DIA',
    endereco: null, responsaveis: [], registros: records('p-helena')
  },
  {
    id: 'p-lucas', nome: 'Lucas Azevedo', data_nascimento: '1991-11-21', telefone: '21900002222', genero: 'MASCULINO',
    status: 'ARQUIVADO', arquivado_em: '2026-09-02T15:00:00.000Z', arquivado_por: 'Dra. Katia', proxima_sessao: null, financeiro: 'EM_DIA',
    endereco: null, responsaveis: [], registros: records('p-lucas')
  }
]

export function writePatients(patients: DbPatient[]) {
  localStorage.setItem(KEY, JSON.stringify(patients))
}

export function readPatients(): DbPatient[] {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as DbPatient[]
    } catch {
      /* banco corrompido: recria abaixo */
    }
  }
  writePatients(SEED)
  return SEED
}
