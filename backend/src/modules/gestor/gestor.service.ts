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

            if (statusUpper === 'PENDENTE' || statusUpper === 'EM_ANALISE') {
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

    async aprovarPsicologo(id_usuario: number, usuarioLogadoId: number) {
        const psicologo = await this.prisma.psicologo.findUnique({
            where: { id_usuario },
            include: { usuario: true },
        })

        if (!psicologo) {
            throw new NotFoundException('Psicólogo não encontrado.')
        }

        if (psicologo.validado === 'APROVADO') {
            throw new BadRequestException('Este psicólogo já se encontra aprovado.')
        }

        if (id_usuario === usuarioLogadoId) {
            throw new BadRequestException('Não é possível aprovar a própria conta.')
        }

        await this.prisma.$transaction([
            this.prisma.psicologo.update({
                where: { id_usuario },
                data: {
                    validado: 'APROVADO',
                    validado_em: new Date(),
                },
            }),
            this.prisma.usuario.update({
                where: { id_usuario },
                data: {
                    esta_ativo: true,
                },
            }),
        ])

        try {
            await this.mail.enviarCadastroAprovado(psicologo.usuario.email, psicologo.usuario.nome)
            this.logger.log(`E-mail de aprovação manual enviado para psicólogo ${id_usuario}.`)
        } catch (error) {
            this.logger.error(`Falha ao enviar e-mail de aprovação manual para psicólogo ${id_usuario}:`, error)
        }

        return {
            sucesso: true,
            mensagem: 'Psicólogo aprovado com sucesso. O usuário já pode acessar o sistema.',
            id_usuario,
        }
    }

    async reprovarPsicologo(id_usuario: number, usuarioLogadoId: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario },
            include: { psicologo: true },
        })

        if (!usuario || !usuario.psicologo) {
            throw new NotFoundException('Psicólogo não encontrado.')
        }

        if (usuario.psicologo.validado === 'APROVADO') {
            throw new BadRequestException('Este psicólogo já se encontra aprovado.')
        }

        if (id_usuario === usuarioLogadoId) {
            throw new BadRequestException('Não é possível reprovar a própria conta.')
        }

        await this.prisma.usuario.delete({
            where: { id_usuario },
        })

        return {
            sucesso: true,
            mensagem: 'Cadastro de psicólogo reprovado e removido com sucesso.',
            id_usuario,
        }
    }

    async inativarPsicologo(id_usuario: number, usuarioLogadoId: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario },
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

        if (id_usuario === usuarioLogadoId) {
            throw new BadRequestException('Não é possível inativar a própria conta.')
        }

        if (usuario.nivel_permissao === 10) {
            throw new BadRequestException('Não é possível inativar um gestor.')
        }

        await this.prisma.usuario.update({
            where: { id_usuario },
            data: {
                esta_ativo: false,
                token_version: usuario.token_version + 1,
            },
        })

        return {
            sucesso: true,
            mensagem: 'Acesso do psicólogo inativado com sucesso.',
            id_usuario,
        }
    }

    async ativarPsicologo(id_usuario: number, usuarioLogadoId: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario },
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

        if (id_usuario === usuarioLogadoId) {
            throw new BadRequestException('Não é possível ativar a própria conta.')
        }

        if (usuario.nivel_permissao === 10) {
            throw new BadRequestException('Não é possível ativar um gestor.')
        }

        await this.prisma.usuario.update({
            where: { id_usuario },
            data: {
                esta_ativo: true,
            },
        })

        return {
            sucesso: true,
            mensagem: 'Acesso do psicólogo reativado com sucesso.',
            id_usuario,
        }
    }
}