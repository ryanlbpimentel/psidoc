import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from '@common/prisma/prisma.module'
import { MailModule } from '@common/mail/mail.module'
import { UserModule } from '@modules/user/user.module'

@Module({
  imports: [PrismaModule, MailModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
