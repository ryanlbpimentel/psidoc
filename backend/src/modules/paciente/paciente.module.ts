import { Module } from '@nestjs/common'
import { UserModule } from '@modules/usuario/usuario.module'
import { PacienteController } from './paciente.controller'
import { PacienteService } from './paciente.service'

@Module({
    imports: [UserModule],
    controllers: [PacienteController],
    providers: [PacienteService],
    exports: [PacienteService],
})
export class PacienteModule { }