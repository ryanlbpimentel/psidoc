export const PROVEDOR_EMAIL = Symbol('PROVEDOR_EMAIL')

export enum TemplateEmail {
  RECUPERACAO_SENHA = 'recuperacao-senha',
  CADASTRO_APROVADO = 'cadastro-aprovado',
}

export abstract class MailProvider {
  abstract enviarEmail(
    para: string,
    assunto: string,
    template: TemplateEmail,
    contexto: Record<string, unknown>): Promise<void>
}