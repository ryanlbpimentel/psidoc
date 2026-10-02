import { Inject, Injectable } from '@nestjs/common'
import { MAIL_PROVIDER } from './interface/mail.interface'
import type { MailProvider } from './interface/mail.interface'
import { recuperacaoSenhaTemplate } from './templates/recuperacao.template'
import type { RecuperacaoSenhaContext } from './templates/recuperacao.template'

@Injectable()
export class MailService {
  constructor(@Inject(MAIL_PROVIDER) private readonly provider: MailProvider) {}

  async enviarRecuperacaoSenha(to: string, context: RecuperacaoSenhaContext): Promise<void> {
    await this.provider.send(recuperacaoSenhaTemplate(to, context))
  }
}
