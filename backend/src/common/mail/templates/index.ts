import { recuperacaoSenhaTemplate } from './recuperacao-senha.template'

export const templatesEmail: Record<string, (context: any) => string> = {
  'recuperacao-senha': recuperacaoSenhaTemplate,
}

export function renderizarTemplateEmail(nomeTemplate: string, contexto: Record<string, unknown>): string {
  const renderizador = templatesEmail[nomeTemplate]

  if (!renderizador) {
    throw new Error(`Template de e-mail "${nomeTemplate}" não foi encontrado.`)
  }

  return renderizador(contexto)
}

// Aliases para compatibilidade retroativa
export const mailTemplates = templatesEmail
export const renderMailTemplate = renderizarTemplateEmail