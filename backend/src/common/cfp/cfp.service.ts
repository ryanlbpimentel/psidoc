import { Injectable, Logger } from '@nestjs/common'
import {
    InfosimplesApiResponse,
    ResultadoValidacaoCfp,
    ValidacaoCfpResult,
} from './cfp.interface'

const REGIAO_PARA_UF: Record<string, string> = {
    '01': 'DF', '1': 'DF',
    '02': 'PE', '2': 'PE',
    '03': 'BA', '3': 'BA',
    '04': 'MG', '4': 'MG',
    '05': 'RJ', '5': 'RJ',
    '06': 'SP', '6': 'SP',
    '07': 'RS', '7': 'RS',
    '08': 'PR', '8': 'PR',
    '09': 'GO', '9': 'GO',
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

    async validarPsicologo(crp: string, nome?: string): Promise<ValidacaoCfpResult> {
        const token = process.env.INFOSIMPLES_TOKEN

        if (!token) {
            this.logger.warn('INFOSIMPLES_TOKEN não configurado no ambiente. Validação será INDISPONIVEL.')
            return {
                resultado: ResultadoValidacaoCfp.INDISPONIVEL,
                motivo: 'Token de integração com a API do CFP não configurado.',
            }
        }

        const dadosCrp = this.extrairDadosCrp(crp)

        if (!dadosCrp) {
            return {
                resultado: ResultadoValidacaoCfp.INVALIDO,
                motivo: 'Formato de CRP inválido. Informe os 2 dígitos da região seguidos dos 5 dígitos de registro (ex: 11/14185 ou 1114185).',
            }
        }

        const payload: Record<string, string> = {
            token,
            uf: dadosCrp.uf,
            registro: dadosCrp.registro,
        }

        if (nome?.trim()) {
            payload.nome = nome.trim()
        }

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
                return {
                    resultado: ResultadoValidacaoCfp.INDISPONIVEL,
                    motivo: `A API externa respondeu com status ${response.status}.`,
                }
            }

            const body = (await response.json()) as InfosimplesApiResponse

            if (body.code === 200) {
                const registros = body.data?.[0]?.resultados ?? []

                if (registros.length === 0) {
                    return {
                        resultado: ResultadoValidacaoCfp.INVALIDO,
                        motivo: 'Nenhum profissional encontrado com os dados informados no CFP.',
                    }
                }

                const registroValido = registros.find((item) => {
                    const situacao = item.situacao ? item.situacao.toUpperCase() : ''
                    return situacao.includes('ATIV')
                })

                if (registroValido) {
                    return {
                        resultado: ResultadoValidacaoCfp.VALIDO,
                        dados: registroValido,
                    }
                }

                return {
                    resultado: ResultadoValidacaoCfp.INVALIDO,
                    motivo: `Registro encontrado no conselho, porém em situação não ativa (${registros[0]?.situacao}).`,
                    dados: registros[0],
                }
            }

            if (body.code === 608) {
                return {
                    resultado: ResultadoValidacaoCfp.INVALIDO,
                    motivo: body.code_message || 'Nenhum registro encontrado no Conselho Federal de Psicologia.',
                }
            }

            this.logger.warn(`API Infosimples retornou código ${body.code}: ${body.code_message}`)
            return {
                resultado: ResultadoValidacaoCfp.INDISPONIVEL,
                motivo: body.code_message || 'A consulta automática não pôde ser completada no momento.',
            }
        } catch (error) {
            this.logger.error('Exceção ao consultar API do CFP na Infosimples:', error)
            return {
                resultado: ResultadoValidacaoCfp.INDISPONIVEL,
                motivo: error instanceof Error ? error.message : 'Falha inesperada na comunicação com a API do CFP.',
            }
        }
    }
}