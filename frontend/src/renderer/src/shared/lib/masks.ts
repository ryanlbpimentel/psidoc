export const onlyDigits = (value: string) => value.replace(/\D/g, '')

export function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function maskCpf(value: string) {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// CRP = 7 dígitos: 2 do conselho regional + 5 do número de registro (ex.: 05/12345).
export const CRP_DIGITS = 7

export function maskCrp(value: string) {
  const d = onlyDigits(value).slice(0, CRP_DIGITS)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export const isValidCrp = (value: string) => onlyDigits(value).length === CRP_DIGITS

export function isValidCpf(value: string) {
  const d = onlyDigits(value)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const digit = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10])
}
