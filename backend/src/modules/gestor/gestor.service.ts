import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@common/prisma/prisma.service'
import { MailService } from '@common/mail/mail.service'

@Injectable()
export class GestorService {
    private readonly logger = new Logger(GestorService.name)

    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
    ) { }

    async listarTodos(status?: string) {
        const where: any = {}

        if (status) {
            const statusUpper = status.toUpperCase()

            if (statusUpper === 'EM_ANALISE') {
                where.validado = 'EM_ANALISE'
            } else if (statusUpper === 'PENDENTE') {
                where.validado = 'PENDENTE'
            } else if (statusUpper === 'APROVADO') {
                where.validado = 'APROVADO'
            } else if (statusUpper === 'ATIVO') {
                where.validado = 'APROVADO'
                where.usuario = { esta_ativo: true }
            } else if (statusUpper === 'INATIVO') {
                where.validado = 'APROVADO'
                where.usuario = { esta_ativo: false }
            }
        }

        return this.prisma.psicologo.findMany({
            where,
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nome: true,
                        email: true,
                        cpf: true,
                        telefone: true,
                        esta_ativo: true,
                        criado_em: true,
                    },
                },
            },
            orderBy: {
                usuario: { criado_em: 'desc' },
            },
        })
    }

    async aprovarPsicologo(idUsuario: number, idUsuarioLogado: number) {
        const psicologo = await this.prisma.psicologo.findUnique({
            where: { id_usuario: idUsuario },
            include: { usuario: true },
        })

        if (!psicologo) {
            throw new NotFoundException('Psicólogo não encontrado.')
        }

        if (psicologo.validado !== 'PENDENTE') {
            throw new BadRequestException('Este psicólogo já se encontra aprovado ou em análise automática.')
        }

        if (idUsuario === idUsuarioLogado) {
            throw new BadRequestException('Não é possível aprovar a própria conta.')
        }

        const [psicologoAtualizado] = await this.prisma.$transaction([
            this.prisma.psicologo.update({
                where: { id_usuario: idUsuario },
                data: {
                    validado: 'APROVADO',
                    validado_em: new Date(),
                },
            }),
            this.prisma.usuario.update({
                where: { id_usuario: idUsuario },
                data: {
                    esta_ativo: true,
                },
            }),
        ])

        try {
            await this.mail.enviarCadastroAprovado(psicologo.usuario.email, psicologo.usuario.nome)
            this.logger.log(`E-mail de aprovação manual enviado para psicólogo ${idUsuario}.`)
        } catch (error) {
            this.logger.error(`Falha ao enviar e-mail de aprovação manual para psicólogo ${idUsuario}:`, error)
        }

        return psicologoAtualizado
    }

    async reprovarPsicologo(idUsuario: number, idUsuarioLogado: number): Promise<void> {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: idUsuario },
            include: { psicologo: true },
        })

        if (!usuario || !usuario.psicologo) {
            throw new NotFoundException('Psicólogo não encontrado.')
        }

        if (usuario.psicologo.validado !== 'PENDENTE') {
            throw new BadRequestException('Este psicólogo já se encontra aprovado ou em análise automática.')
        }

        if (idUsuario === idUsuarioLogado) {
            throw new BadRequestException('Não é possível reprovar a própria conta.')
        }

        await this.prisma.usuario.delete({
            where: { id_usuario: idUsuario },
        })
    }

    async inativarPsicologo(idUsuario: number, idUsuarioLogado: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: idUsuario },
            include: { psicologo: true },
        })

        if (!usuario || !usuario.psicologo) {
            throw new NotFoundException('Psicólogo não encontrado.')
        }

        if (!usuario.esta_ativo) {
            throw new BadRequestException('Este psicólogo já se encontra inativo.')
        }

        if (usuario.psicologo.validado !== 'APROVADO') {
            throw new BadRequestException('Este psicólogo ainda não foi aprovado.')
        }

        if (idUsuario === idUsuarioLogado) {
            throw new BadRequestException('Não é possível inativar a própria conta.')
        }

        if (usuario.roles.includes('GESTOR')) {
            throw new BadRequestException('Não é possível inativar um gestor.')
        }

        return this.prisma.usuario.update({
            where: { id_usuario: idUsuario },
            data: {
                esta_ativo: false,
                token_version: usuario.token_version + 1,
            },
            select: {
                id_usuario: true,
                esta_ativo: true,
            },
        })
    }

    async ativarPsicologo(idUsuario: number, idUsuarioLogado: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: idUsuario },
            include: { psicologo: true },
        })

        if (!usuario || !usuario.psicologo) {
            throw new NotFoundException('Psicólogo não encontrado.')
        }

        if (usuario.esta_ativo) {
            throw new BadRequestException('Este psicólogo já se encontra ativo.')
        }

        if (usuario.psicologo.validado !== 'APROVADO') {
            throw new BadRequestException('Este psicólogo ainda não foi aprovado.')
        }

        if (idUsuario === idUsuarioLogado) {
            throw new BadRequestException('Não é possível ativar a própria conta.')
        }

        if (usuario.roles.includes('GESTOR')) {
            throw new BadRequestException('Não é possível ativar um gestor.')
        }

        return this.prisma.usuario.update({
            where: { id_usuario: idUsuario },
            data: {
                esta_ativo: true,
            },
            select: {
                id_usuario: true,
                esta_ativo: true,
            },
        })
    }
}