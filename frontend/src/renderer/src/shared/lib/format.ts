const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatBRL = (value: number) => brl.format(value)

/** Iniciais ignorando títulos ("Dra." → pula). `count` = quantas letras. */
export function initials(name: string, count = 2) {
  return name
    .split(/\s+/)
    .filter((part) => part && !part.endsWith('.'))
    .slice(0, count)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
