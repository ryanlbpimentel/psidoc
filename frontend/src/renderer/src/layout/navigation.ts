import { CalendarDays, FileText, LayoutDashboard, Mic, SlidersHorizontal, Users, Wallet, type LucideIcon } from 'lucide-react'
import type { UserRole } from '@/core/auth/auth.types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface NavSection {
  role: UserRole
  title: string
  items: NavItem[]
}

export const PSICOLOGO_NAV: NavItem[] = [
  { to: '/painel', label: 'Painel', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/transcricao', label: 'Transcrição', icon: Mic },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/configuracoes', label: 'Configurações', icon: SlidersHorizontal }
]

export const GESTOR_NAV: NavItem[] = [{ to: '/gestor/psicologos', label: 'Psicólogos', icon: Users }]

/**
 * Seções da barra lateral. Quem acumula os dois perfis vê as duas áreas (Psicólogo e Gestor);
 * quem tem um perfil só continua vendo apenas o que é seu.
 */
export function navigationFor(roles: UserRole[]): { sections: NavSection[]; showTitles: boolean } {
  const sections: NavSection[] = []
  if (roles.includes('PSICOLOGO')) sections.push({ role: 'PSICOLOGO', title: 'Psicólogo', items: PSICOLOGO_NAV })
  if (roles.includes('GESTOR')) sections.push({ role: 'GESTOR', title: 'Gestor', items: GESTOR_NAV })
  // Título só aparece quando há mais de uma área (ou na área do gestor, como já era).
  return { sections, showTitles: sections.length > 1 || roles.every((r) => r === 'GESTOR') }
}
