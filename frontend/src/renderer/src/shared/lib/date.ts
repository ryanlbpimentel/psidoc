const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export const todayIso = () => {
  const n = new Date()
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`
}

/** "12/04/1998" → "1998-04-12" (null se a data não existir no calendário). */
export function brToIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = Number(dd)
  const mo = Number(mm)
  const y = Number(yyyy)
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return `${yyyy}-${mm}-${dd}`
}

/** "1998-04-12" (ou ISO completo) → "12/04/1998". */
export function isoToBr(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function isValidBirthDate(br: string) {
  const iso = brToIso(br)
  if (!iso) return false
  return Number(iso.slice(0, 4)) >= 1900 && iso <= todayIso()
}

export function ageFromIso(iso: string, now = new Date()) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--
  return Math.max(age, 0)
}

/** "24/09/2026 · 14:00" */
export function formatDateTimeBr(iso: string) {
  const dt = new Date(iso)
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} · ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

/** "24 Set às 14:00" */
export function formatSession(iso: string) {
  const dt = new Date(iso)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} às ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}
