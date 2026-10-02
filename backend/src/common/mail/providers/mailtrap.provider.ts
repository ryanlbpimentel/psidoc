import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailtrapClient } from 'mailtrap'
import { ProvedorEmail, TemplateEmail } from '../mail.interface'
import { renderizarTemplateEmail } from '../templates'

@Injectable()
export class MailtrapProvedorEmail extends ProvedorEmail {
  private readonly logger = new Logger(MailtrapProvedorEmail.name)
  private readonly remetente: { endereco: string; nome: string }
  private readonly client: MailtrapClient

  constructor(private readonly config: ConfigService) {
    super()

    const token = this.config.get<string>('MAILTRAP_TOKEN', '')
    this.client = new MailtrapClient({ token })

    this.remetente = {
      endereco: this.config.get<string>('MAIL_FROM_ADDRESS', 'hello@demomailtrap.co'),
      nome: this.config.get<string>('MAIL_FROM_NAME', 'PSIDOC'),
    }
  }

  async enviarEmail(
    para: string,
    assunto: string,
    template: TemplateEmail,
    contexto: Record<string, unknown>,
  ): Promise<void> {
    try {
      const html = renderizarTemplateEmail(template, contexto)

      await this.client.send({
        from: { email: this.remetente.endereco, name: this.remetente.nome },
        to: [{ email: para }],
        subject: assunto,
        html,
      })

      this.logger.log(`E-mail enviado com sucesso para ${para}`)
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${para}:`, error)
      throw error
    }
  }

  // Alias para manter compatibilidade
  async sendEmail(
    to: string,
    subject: string,
    template: TemplateEmail,
    context: Record<string, unknown>,
  ): Promise<void> {
    return this.enviarEmail(to, subject, template, context)
  }
}

// Alias para compatibilidade
export { MailtrapProvedorEmail as MailtrapMailProvider }