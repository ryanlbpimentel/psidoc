import { Module } from '@nestjs/common'
import { PrismaModule } from '@common/prisma/prisma.module'
import { MailModule } from '@common/mail/mail.module'
import { UserModule } from '@modules/usuario/usuario.module'
import { GestorModule } from '@modules/gestor/gestor.module'
import { PacienteModule } from '@modules/paciente/paciente.module'

@Module({
  imports: [PrismaModule, MailModule, UserModule, GestorModule, PacienteModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
