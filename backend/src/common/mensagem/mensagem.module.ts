import { Module } from '@nestjs/common'
import { MensagemService } from './mensagem.service'

@Module({
    providers: [MensagemService],
    exports: [MensagemService],
})
export class MensagemModule { }
