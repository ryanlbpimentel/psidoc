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

    async listarPendentes() {
        return this.prisma.psicologo.findMany({
            where: { validado: 'PENDENTE' },
            include: {
                usuario: {
                    select: {
                        id_usuario: true,
                        nome: true,
                        email: true,
                        cpf: true,
                        telefone: true,
                        criado_em: true,
                    },
                },
            },
            orderBy: {
                usuario: { criado_em: 'asc' },
            },
        })
    }

    async aprovarPsicologo(id_usuario: number) {
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

    async reprovarPsicologo(id_usuario: number) {
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

        await this.prisma.usuario.delete({
            where: { id_usuario },
        })

        return {
            sucesso: true,
            mensagem: 'Cadastro de psicólogo reprovado e removido com sucesso.',
            id_usuario,
        }
    }
}