import { Injectable, Logger } from '@nestjs/common'

export enum CanalMensagem {
    WHATSAPP = 'WHATSAPP',
    SMS = 'SMS',
}

@Injectable()
export class MensagemService {
    private readonly logger = new Logger(MensagemService.name)

    // telefone: DDD + número, só dígitos (como fica salvo no cadastro)
    async enviar(canal: CanalMensagem, telefone: string, texto: string): Promise<boolean> {
        const whatsapp = canal === CanalMensagem.WHATSAPP
        const sid = process.env.TWILIO_ACCOUNT_SID
        const token = process.env.TWILIO_AUTH_TOKEN
        const remetente = whatsapp ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM

        if (!sid || !token || !remetente) {
            this.logger.warn('Credenciais da Twilio não configuradas no ambiente. Envio INDISPONIVEL.')
            return false
        }

        const prefixo = whatsapp ? 'whatsapp:' : ''

        try {
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
                },
                body: new URLSearchParams({
                    To: `${prefixo}+55${telefone}`,
                    From: `${prefixo}${remetente}`,
                    Body: texto,
                }),
                signal: AbortSignal.timeout(15000),
            })

            if (!response.ok) {
                this.logger.error(`Erro HTTP na API da Twilio: ${response.status} ${await response.text()}`)
                return false
            }

            return true
        } catch (error) {
            this.logger.error('Exceção ao enviar mensagem pela Twilio:', error)
            return false
        }
    }
}
