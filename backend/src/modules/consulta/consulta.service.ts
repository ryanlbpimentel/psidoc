import {
    BadGatewayException,
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@common/prisma/prisma.service'
import { MensagemService } from '@common/mensagem/mensagem.service'
import { AgendarConsultaDto } from './dto/agendar-consulta.dto'
import { ConsultarAgendaDto } from './dto/consultar-agenda.dto'
import { EnviarLembreteDto } from './dto/enviar-lembrete.dto'

const DURACAO_SESSAO_MS = 60 * 60 * 1000
const EXTENSAO_SESSAO_MS = 10 * 60 * 1000
const ANTECEDENCIA_ALERTA_MS = 10 * 60 * 1000
const FUSO_HORARIO = 'America/Sao_Paulo'

@Injectable()
export class ConsultaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mensagem: MensagemService,
    ) { }

    async agendarConsulta(idPsicologo: number, dto: AgendarConsultaDto) {
        const paciente = await this.prisma.paciente.findFirst({
            where: {
                id_paciente: dto.id_paciente,
                id_psicologo: idPsicologo,
            },
        })

        if (!paciente) {
            throw new NotFoundException('Paciente não encontrado.')
        }

        const inicio = new Date(dto.inicio)
        const fim = new Date(inicio.getTime() + DURACAO_SESSAO_MS)

        const conflito = await this.prisma.consulta.findFirst({
            where: {
                id_psicologo: idPsicologo,
                inicio: { lt: fim },
                fim: { gt: inicio },
            },
        })

        if (conflito) {
            throw new ConflictException('Já existe uma consulta agendada neste horário.')
        }

        return this.prisma.consulta.create({
            data: {
                id_psicologo: idPsicologo,
                id_paciente: dto.id_paciente,
                inicio,
                fim,
                local: dto.local,
            },
        })
    }

    async consultarAgenda(idPsicologo: number, dto: ConsultarAgendaDto) {
        return this.prisma.consulta.findMany({
            where: {
                id_psicologo: idPsicologo,
                inicio: {
                    gte: dto.data_inicio ? new Date(dto.data_inicio) : undefined,
                    lte: dto.data_fim ? new Date(dto.data_fim) : undefined,
                },
            },
            orderBy: { inicio: 'asc' },
            include: { paciente: { select: { nome: true } } },
        })
    }

    async enviarLembrete(idPsicologo: number, idConsulta: number, dto: EnviarLembreteDto) {
        const consulta = await this.prisma.consulta.findFirst({
            where: {
                id_consulta: idConsulta,
                id_psicologo: idPsicologo,
            },
            include: {
                paciente: { select: { nome: true, telefone: true } },
                psicologo: { select: { usuario: { select: { nome: true } } } },
            },
        })

        if (!consulta) {
            throw new NotFoundException('Consulta não encontrada.')
        }

        if (!consulta.paciente.telefone) {
            throw new BadRequestException('O paciente não possui telefone cadastrado.')
        }

        const data = consulta.inicio.toLocaleDateString('pt-BR', { timeZone: FUSO_HORARIO })
        const hora = consulta.inicio.toLocaleTimeString('pt-BR', {
            timeZone: FUSO_HORARIO,
            hour: '2-digit',
            minute: '2-digit',
        })
        const mensagem =
            `Olá, ${consulta.paciente.nome}! Lembrete da sua consulta com ${consulta.psicologo.usuario.nome} ` +
            `no dia ${data} às ${hora}. Local: ${consulta.local}.`

        const enviado = await this.mensagem.enviar(dto.canal, consulta.paciente.telefone, mensagem)

        if (!enviado) {
            throw new BadGatewayException('Não foi possível enviar o lembrete.')
        }

        return { sucesso: true, id_consulta: consulta.id_consulta, canal: dto.canal }
    }

    async consultarEmAndamento(idPsicologo: number) {
        const agora = new Date()

        const consultas = await this.prisma.consulta.findMany({
            where: {
                id_psicologo: idPsicologo,
                inicio: { lte: agora },
                fim: { gte: agora },
            },
            orderBy: { inicio: 'asc' },
            include: { paciente: { select: { nome: true } } },
        })

        return consultas.map((consulta) => {
            const restanteMs = consulta.fim.getTime() - agora.getTime()

            return {
                ...consulta,
                minutos_restantes: Math.ceil(restanteMs / 60000),
                alertar: restanteMs <= ANTECEDENCIA_ALERTA_MS,
            }
        })
    }

    async estenderConsulta(idPsicologo: number, idConsulta: number) {
        const consulta = await this.prisma.consulta.findFirst({
            where: {
                id_consulta: idConsulta,
                id_psicologo: idPsicologo,
            },
        })

        if (!consulta) {
            throw new NotFoundException('Consulta não encontrada.')
        }

        const agora = new Date()

        if (agora < consulta.inicio || agora > consulta.fim) {
            throw new BadRequestException('A consulta não está em andamento.')
        }

        if (consulta.fim.getTime() - consulta.inicio.getTime() > DURACAO_SESSAO_MS) {
            throw new BadRequestException('A consulta já foi estendida.')
        }

        return this.prisma.consulta.update({
            where: { id_consulta: idConsulta },
            data: { fim: new Date(consulta.fim.getTime() + EXTENSAO_SESSAO_MS) },
        })
    }
}
