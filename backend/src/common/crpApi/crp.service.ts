import { Injectable, Logger } from '@nestjs/common'
import {
    InfosimplesApiResponse,
} from './crp.interface'

const REGIAO_PARA_UF: Record<string, string> = {
    '01': 'DF',
    '02': 'PE',
    '03': 'BA',
    '04': 'MG',
    '05': 'RJ',
    '06': 'SP',
    '07': 'RS',
    '08': 'PR',
    '09': 'GO',
    '10': 'PA',
    '11': 'CE',
    '12': 'SC',
    '13': 'PB',
    '14': 'MS',
    '15': 'AL',
    '16': 'ES',
    '17': 'RN',
    '18': 'MT',
    '19': 'SE',
    '20': 'AM',
    '21': 'PI',
    '22': 'MA',
    '23': 'TO',
    '24': 'RO',
}

@Injectable()
export class CfpService {
    private readonly logger = new Logger(CfpService.name)

    private extrairDadosCrp(crp: string): { uf: string; registro: string } | null {
        const regiao = crp.slice(0, 2)
        const registro = crp.slice(2)
        const uf = REGIAO_PARA_UF[regiao]

        if (uf) {
            return { uf, registro }
        }

        return null
    }

    async validarPsicologo(crp: string): Promise<boolean> {
        const token = process.env.INFOSIMPLES_TOKEN

        if (!token) {
            this.logger.warn('INFOSIMPLES_TOKEN não configurado no ambiente. Validação será INDISPONIVEL.')
            return false
        }

        const dadosCrp = this.extrairDadosCrp(crp)

        if (!dadosCrp) {
            return false
        }

        const payload: Record<string, string> = { token, uf: dadosCrp.uf, registro: dadosCrp.registro }

        try {
            const response = await fetch('https://api.infosimples.com/api/v2/consultas/cfp/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(120000), // 2 minutos
            })

            if (!response.ok) {
                this.logger.error(`Erro HTTP na API da Infosimples: ${response.status} ${response.statusText}`)
                return false
            }

            const body = (await response.json()) as InfosimplesApiResponse

            if (body.code === 200) {
                const registros = body.data?.[0]?.resultados ?? []

                if (registros.length === 0) {
                    return false
                }

                const registroValido = registros.find((item) => {
                    const situacao = item.situacao ? item.situacao.toUpperCase() : ''
                    return situacao.includes('ATIV')
                })

                if (registroValido) {
                    return true
                }

                return false
            }

            this.logger.warn(`API Infosimples retornou código ${body.code}: ${body.code_message}`)
            return false
        } catch (error) {
            this.logger.error('Exceção ao consultar API do CFP na Infosimples:', error)
            return false
        }
    }
}