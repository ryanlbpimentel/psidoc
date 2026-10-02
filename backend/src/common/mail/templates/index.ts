import { recuperacaoSenhaTemplate } from './recuperacao-senha.template'
import { cadastroAprovadoTemplate } from './cadastro-aprovado.template'

export const templatesEmail: Record<string, (context: any) => string> = {
  'recuperacao-senha': recuperacaoSenhaTemplate,
  'cadastro-aprovado': cadastroAprovadoTemplate,
}

export function renderizarTemplateEmail(nomeTemplate: string, contexto: Record<string, unknown>): string {
  const renderizador = templatesEmail[nomeTemplate]

  if (!renderizador) {
    throw new Error(`Template de e-mail "${nomeTemplate}" não foi encontrado.`)
  }

  return renderizador(contexto)
}