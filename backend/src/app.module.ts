import { Module } from '@nestjs/common'
import { PrismaModule } from '@common/prisma/prisma.module'
import { MailModule } from '@common/mail/mail.module'
import { UserModule } from '@modules/usuario/usuario.module'
import { GestorModule } from '@modules/gestor/gestor.module'

@Module({
  imports: [PrismaModule, MailModule, UserModule, GestorModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
