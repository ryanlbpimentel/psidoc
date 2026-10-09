import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
//import { MailtrapClient } from 'mailtrap'
import { MailProvider, TemplateEmail } from '../mail.interface'
import { renderizarTemplateEmail } from '../templates'
import  * as nodeMailer  from 'nodemailer'

@Injectable()
export class MailtrapProvider extends MailProvider {
  private readonly logger = new Logger(MailtrapProvider.name)
  private readonly remetente: { endereco: string, nome: string }
  private readonly client: nodeMailer.Transporter

  constructor(private readonly config: ConfigService) {
    super()

    const token = this.config.get<string>('MAILTRAP_TOKEN', '')
    this.client = nodeMailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "6c222208a48338",
        pass: "9643b81a0ae41c"
      }
    })

    this.remetente = {
      endereco: this.config.get<string>('MAIL_FROM_ADDRESS', 'sandbox.smtp.mailtrap.io'),
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

      await this.client.sendMail({
        from: `${this.remetente.nome} <${this.remetente.endereco}>`,
        to: `${para}`,
        subject: assunto,
        html,
      })

      this.logger.log(`E-mail enviado com sucesso para ${para}`)
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${para}:`, error)
      throw error
    }
  }
}