import type { MailMessage } from '../interface/mail.interface'

export interface RecuperacaoSenhaContext {
  token: string
  nome: string
  validadeMinutos: number
}

export function recuperacaoSenhaTemplate(
  to: string,
  context: RecuperacaoSenhaContext,
): MailMessage {
  const primeiroNome = context.nome.split(' ')[0]
  return {
    to,
    subject: 'Psidoc: recuperação de senha',
    message: [
      `Olá, ${primeiroNome}.`,
      '',
      'Use o código abaixo para redefinir sua senha:',
      '',
      context.token,
      '',
      `Ele vale por ${context.validadeMinutos} minutos e só pode ser usado uma vez.`,
      'Se você não pediu essa redefinição, ignore este e-mail.',
    ].join('\n'),
    context: { ...context },
  }
}
