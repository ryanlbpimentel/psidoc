import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MailProvider } from './mail.interface'
import { MailService } from './mail.service'
import { MailtrapProvider } from './providers/mailtrap.provider'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    MailtrapProvider,
    {
      provide: MailProvider,
      useFactory: (config: ConfigService, mailtrapProvider: MailtrapProvider) => {
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
      inject: [ConfigService, MailtrapProvider],
    },
    MailService,
  ],
  exports: [MailService, MailProvider],
})
export class MailModule {}