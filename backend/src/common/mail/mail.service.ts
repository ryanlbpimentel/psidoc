import { Injectable } from '@nestjs/common'
import { ProvedorEmail, TemplateEmail } from './mail.interface'

@Injectable()
export class MailService {
  constructor(private readonly provedorEmail: ProvedorEmail) {}

  async enviarRecuperacaoSenha(para: string, nome: string, token: string): Promise<void> {
    const link = `http://localhost:3000/redefinir-senha?token=${token}`

    await this.provedorEmail.enviarEmail(
      para,
      'Redefinição de Senha - PSIDOC',
      TemplateEmail.RECUPERACAO_SENHA,
      { nome, link },
    )
  }

  // Alias para manter compatibilidade
  async sendPasswordReset(to: string, nome: string, token: string): Promise<void> {
    return this.enviarRecuperacaoSenha(to, nome, token)
  }
}

export { MailService as EmailService }