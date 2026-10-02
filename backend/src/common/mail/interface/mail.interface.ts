// Token de injeção do provider de e-mail (ver mail.module.ts). Fica junto da interface que ele
// implementa pra não criar import circular com mail.service.ts.
export const MAIL_PROVIDER = 'MAIL_PROVIDER'

// Estrutura única que todo provider de e-mail usa: to/subject/message são sempre obrigatórios;
// context é opcional e carrega o que o template precisar (aqui, o token de recuperação de senha;
// pode ter de 0 a N campos, por isso fica solto em vez de um tipo genérico).
export interface MailMessage {
  to: string
  subject: string
  message: string
  context?: Record<string, unknown>
}

export interface MailProvider {
  send(mail: MailMessage): Promise<void>
}
