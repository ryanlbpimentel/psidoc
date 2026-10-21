import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { CanalMensagem } from '@common/mensagem/mensagem.service'

export class EnviarLembreteDto {
    @ApiProperty({
        enum: CanalMensagem,
        description: 'Canal de envio do lembrete',
        example: CanalMensagem.WHATSAPP,
    })
    @IsEnum(CanalMensagem, { message: 'Canal inválido. Use WHATSAPP ou SMS' })
    canal: CanalMensagem
}
