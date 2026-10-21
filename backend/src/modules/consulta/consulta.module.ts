import { Module } from '@nestjs/common'
import { MensagemModule } from '@common/mensagem/mensagem.module'
import { UserModule } from '@modules/usuario/usuario.module'
import { ConsultaController } from './consulta.controller'
import { ConsultaService } from './consulta.service'

@Module({
    imports: [UserModule, MensagemModule],
    controllers: [ConsultaController],
    providers: [ConsultaService],
})
export class ConsultaModule { }
