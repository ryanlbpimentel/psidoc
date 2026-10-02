import { Injectable } from '@nestjs/common'
import { MailtrapClient } from 'mailtrap'
import { MailMessage, MailProvider } from '../interface/mail.interface'

@Injectable()
export class MailtrapProvider implements MailProvider {
  private readonly client: MailtrapClient
  private readonly fromEmail = process.env.MAIL_FROM_EMAIL ?? 'no-reply@psidoc.local'
  private readonly fromName = process.env.MAIL_FROM_NAME ?? 'Psidoc'

  constructor() {
    const sandbox = process.env.MAILTRAP_USE_SANDBOX === 'true'
    this.client = new MailtrapClient({
      token: process.env.MAILTRAP_API_KEY ?? '',
      sandbox,
      testInboxId: sandbox ? Number(process.env.MAILTRAP_INBOX_ID) : undefined,
    })
  }

  async send(mail: MailMessage): Promise<void> {
    await this.client.send({
      from: { name: this.fromName, email: this.fromEmail },
      to: [{ email: mail.to }],
      subject: mail.subject,
      text: mail.message,
    })
  }
}
