import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@common/prisma/prisma.service'

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async encerrarSessao(id_usuario: number) {
        const usuarioExistente = await this.prisma.usuario.findUnique({
            where: { id_usuario: id_usuario },
        })


        if (!usuarioExistente) {
            throw new NotFoundException('Usuário não encontrado')
        }

        const usuarioAtualizado = await this.prisma.usuario.update({
            where: { id_usuario: id_usuario },
            data: {
                token_version: usuarioExistente.token_version + 1,
            },
            select: {
                id_usuario: true,
                email: true,
                token_version: true,
            }
        })

        return {
            sucesso: true,
            mensagem: 'Sessão encerrada com sucesso',
            id_usuario: usuarioAtualizado.id_usuario,
            nova_versao_token: usuarioAtualizado.token_version,
        }
    }

    async validarVersaoToken(id_usuario: number, versaoToken: number): Promise<boolean> {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario },
            select: {
                token_version: true,
                esta_ativo: true,
            },
        });

        if (!usuario || !usuario.esta_ativo) {
            return false;
        }

        return usuario.token_version === versaoToken;
    }
}