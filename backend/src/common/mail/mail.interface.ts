export const PROVEDOR_EMAIL = Symbol('PROVEDOR_EMAIL')
export const MAIL_PROVIDER = PROVEDOR_EMAIL

export enum TemplateEmail {
  RECUPERACAO_SENHA = 'recuperacao-senha',
}
export { TemplateEmail as MailTemplate }

export abstract class ProvedorEmail {
  abstract enviarEmail(
    para: string,
    assunto: string,
    template: TemplateEmail,
    contexto: Record<string, unknown>
  ): Promise<void>
}
export { ProvedorEmail as MailProvider }