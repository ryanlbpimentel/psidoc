import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
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

      return this.criarTokenLogin(usuario.id_usuario, usuario.email)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('E-mail, CPF ou CRP já cadastrado.')
      }
      throw error
    }
  }

  // Alias para compatibilidade caso chamado em inglês
  async register(dto: RegistrarDto): Promise<{ access_token: string }> {
    return this.registrar(dto)
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } })

    if (!usuario || !(await bcrypt.compare(dto.senha, usuario.senha))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.')
    }

    return this.criarTokenLogin(usuario.id_usuario, usuario.email)
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

  private criarTokenLogin(id_usuario: number, email: string): { access_token: string } {
    return { access_token: this.jwt.sign({ sub: id_usuario, email }) }
  }
}
