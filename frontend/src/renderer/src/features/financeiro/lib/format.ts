import { formatBRL } from '@/shared/lib/format'

const pad = (n: number) => String(n).padStart(2, '0')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "AAAA-MM" do mês atual (valor do campo de mês). */
export const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** "2026-10" → "Outubro de 2026" */
export const fmtMonth = (mes: string) => {
  const [y, m] = mes.split('-').map(Number)
  return cap(new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
}

/** Valor digitado → reais. Só os dígitos contam, como centavos: "120000" → 1200. */
export const parseMoney = (text: string) => Number(text.replace(/\D/g, '') || '0') / 100

/** Máscara do campo de dinheiro: "120000" → "R$ 1.200,00"; vazio continua vazio. */
export const maskMoney = (text: string) => (text.replace(/\D/g, '') ? formatBRL(parseMoney(text)) : '')

export const pacoteLabel = (p: { quantidade_sessoes: number; valor_total: number }) =>
  `${p.quantidade_sessoes} ${p.quantidade_sessoes === 1 ? 'sessão' : 'sessões'} · ${formatBRL(p.valor_total)}`
