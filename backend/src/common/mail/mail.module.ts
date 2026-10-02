import { Global, Module } from '@nestjs/common'
import { MAIL_PROVIDER } from './interface/mail.interface'
import { MailtrapProvider } from './providers/mailtrap.provider'
import { MailService } from './mail.service'

@Global()
@Module({
  providers: [{ provide: MAIL_PROVIDER, useClass: MailtrapProvider }, MailService],
  exports: [MailService],
})
export class MailModule {}
