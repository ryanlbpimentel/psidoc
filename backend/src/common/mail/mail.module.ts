import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ProvedorEmail } from './mail.interface'
import { MailService } from './mail.service'
import { MailtrapProvedorEmail } from './providers/mailtrap.provider'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    MailtrapProvedorEmail,
    {
      provide: ProvedorEmail,
      useFactory: (config: ConfigService, mailtrapProvider: MailtrapProvedorEmail) => {
        const providerName = config.get<string>('MAIL_PROVIDER', 'mailtrap').toLowerCase()

        switch (providerName) {
          case 'mailtrap':
            return mailtrapProvider
          case 'resend':
            throw new Error('Resend ainda não configurado')
          case 'aws-ses':
            throw new Error('AWS SES ainda não configurado')
          default:
            return mailtrapProvider
        }
      },
      inject: [ConfigService, MailtrapProvedorEmail],
    },
    MailService,
  ],
  exports: [MailService, ProvedorEmail],
})
export class MailModule {}