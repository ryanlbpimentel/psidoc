import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from '@common/prisma/prisma.module'
import { MailModule } from '@common/mail/mail.module'
import { UserModule } from '@modules/user/user.module'
import { GestorModule } from '@modules/gestor/gestor.module'

@Module({
  imports: [PrismaModule, MailModule, UserModule, GestorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
