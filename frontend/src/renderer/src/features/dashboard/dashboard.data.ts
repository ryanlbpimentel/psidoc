// Dados fictícios do painel (ainda não existe endpoint). Trocar por chamadas à API depois.
export const todayAgenda = [
  { time: '09:00', patient: 'Ana Clara Monteiro', place: 'Consultório Centro' },
  { time: '10:30', patient: 'Bruno Henrique Costa', place: 'Sala Ipanema' },
  { time: '14:00', patient: 'Clarice Fontes', place: 'Online' },
  { time: '16:00', patient: 'Daniel Gouveia', place: 'Consultório Centro' }
]

export const pendingPayments = [
  { id: 1, patient: 'Mateus Assis', session: 'Sessão de 24 Set', amount: 220 },
  { id: 2, patient: 'Júlia Peixoto', session: 'Sessão de 22 Set', amount: 440 },
  { id: 3, patient: 'Rodrigo Mendes', session: 'Sessão de 18 Set', amount: 220 }
]

export const monthlyRevenue = { total: 12450, previousMonthLabel: 'Faturamento de Setembro', variation: '+12%' }

export const clinicalSummary = [
  { label: 'Pacientes Ativos', value: '28', alert: false },
  { label: 'Horas Clínicas', value: '120h / mês', alert: false },
  { label: 'Faltas Recorrentes', value: '1.5%', alert: true }
]
