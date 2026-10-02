import { ConflictException, Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { createHash, randomBytes } from 'node:crypto'
import * as bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import { PrismaService } from '@common/prisma/prisma.service'
import { MailService } from '@common/mail/mail.service'
import { LoginDto } from './dto/login.dto'
import { RegistrarDto } from './dto/registrar.dto'
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto'
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) { }

  async registrar(dto: RegistrarDto): Promise<{ access_token: string }> {
    const senha = await bcrypt.hash(dto.senha, 10)

    if (await this.prisma.usuario.findUnique({ where: { email: dto.email } })) {
      throw new ConflictException('E-mail já cadastrado.')
    }

    if (await this.prisma.usuario.findUnique({ where: { cpf: dto.cpf } })) {
      throw new ConflictException('CPF já cadastrado.')
    }

    if (await this.prisma.psicologo.findUnique({ where: { crp: dto.crp } })) {
      throw new ConflictException('CRP já cadastrado.')
    }

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          cpf: dto.cpf,
          telefone: dto.telefone,
          senha,
          psicologo: {
            create: { crp: dto.crp },
          },
        },
      })

      return this.criarTokenLogin(usuario.id_usuario, usuario.email, usuario.token_version, usuario.nivel_permissao)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('E-mail, CPF ou CRP já cadastrado.')
      }
      throw error
    }
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } })

    if (!usuario || !(await bcrypt.compare(dto.senha, usuario.senha))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.')
    }

    return this.criarTokenLogin(usuario.id_usuario, usuario.email, usuario.token_version, usuario.nivel_permissao)
  }

  async esqueciSenha(dto: EsqueciSenhaDto): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } })

    if (!usuario) {
      return
    }

    const agora = new Date()

    const tokenAntigos = await this.prisma.token.findMany({
      where: { id_usuario: usuario.id_usuario, usado_em: null },
    })

    for (const token of tokenAntigos) {
      await this.prisma.token.update({
        where: { id_token: token.id_token },
        data: { usado_em: agora },
      })
    }

    const token = this.criarTokenRecuperacao()

    await this.prisma.token.create({
      data: {
        id_usuario: usuario.id_usuario,
        tipo: 'RECUPERACAO_SENHA',
        token_hash: token,
        expira_em: new Date(agora.getTime() + 15 * 60_000),
      },
    })

    try {
      await this.mail.enviarRecuperacaoSenha(usuario.email, usuario.nome, token)
    } catch (error) {
      this.logger.error('Falha ao enviar e-mail de recuperação de senha.', error)
    }
  }

  async redefinirSenha(dto: RedefinirSenhaDto): Promise<void> {
    const tokenEncontrado = await this.prisma.token.findUnique({
      where: { token_hash: dto.token },
    })

    if (!tokenEncontrado || tokenEncontrado.usado_em || tokenEncontrado.expira_em < new Date()) {
      throw new UnauthorizedException('Código inválido ou expirado.')
    }

    const senha = await bcrypt.hash(dto.novaSenha, 10)

    await this.prisma.$transaction([
      this.prisma.token.update({
        where: { id_token: tokenEncontrado.id_token },
        data: { usado_em: new Date() },
      }),
      this.prisma.usuario.update({ where: { id_usuario: tokenEncontrado.id_usuario }, data: { senha } }),
    ])
  }

  private criarTokenRecuperacao(): string {
    const token = randomBytes(32).toString('hex')
    return createHash('sha256').update(token).digest('hex')
  }

  private criarTokenLogin(id_usuario: number, email: string, token_version: number, nivel_permissao: number): { access_token: string } {
    return { access_token: this.jwt.sign({ sub: id_usuario, id_usuario, email, token_version, nivel_permissao }) }
  }

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
        nivel_permissao: true,
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
    })

    if (!usuario || !usuario.esta_ativo) {
      return false
    }

    return usuario.token_version === versaoToken
  }
}
