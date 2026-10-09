import { Module } from '@nestjs/common'
import { UserModule } from '@modules/usuario/usuario.module'
import { GestorController } from './gestor.controller'
import { GestorService } from './gestor.service'

@Module({
    imports: [UserModule],
    controllers: [GestorController],
    providers: [GestorService],
    exports: [GestorService],
})
export class GestorModule { }