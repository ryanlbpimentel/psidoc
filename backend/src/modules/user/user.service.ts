import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { createHash, randomBytes } from 'node:crypto'
import * as bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import { PrismaService } from '@common/prisma/prisma.service'
import { MailService } from '@common/mail/mail.service'
import { LoginDto, RegistrarUsuarioDto } from './dto/user.dto'

const SALT_ROUNDS = 10
const RECUPERACAO_TTL_MINUTOS = 15

export interface AutenticacaoResult {
  access_token: string
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  // Task 1 (US01): cria o usuário e o psicólogo (todo psicólogo é um usuário) e já devolve o
  // token, sem se preocupar com funções/papéis por agora.
  async registrar(dto: RegistrarUsuarioDto): Promise<AutenticacaoResult> {
    const senha = await bcrypt.hash(dto.senha, SALT_ROUNDS)

    let usuario: { id_usuario: number; email: string }
    try {
      usuario = await this.prisma.$transaction(async (tx) => {
        const novoUsuario = await tx.usuario.create({
          data: { nome: dto.nome, email: dto.email, cpf: dto.cpf, telefone: dto.telefone, senha },
        })
        await tx.psicologo.create({ data: { id_usuario: novoUsuario.id_usuario, crp: dto.crp } })
        return novoUsuario
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('E-mail, CPF ou CRP já cadastrado.')
      }
      throw error
    }

    return this.gerarToken(usuario.id_usuario, usuario.email)
  }

  // Task 2 (US03): tanto psicólogo quanto gestor (criado manualmente no banco) autenticam aqui
  // — só confere e-mail e senha, sem checar papel.
  async login(dto: LoginDto): Promise<AutenticacaoResult> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } })
    if (!usuario || !(await bcrypt.compare(dto.senha, usuario.senha))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.')
    }
    return this.gerarToken(usuario.id_usuario, usuario.email)
  }

  // Task 3 (US04), passo 1: gera um token de uso único e manda por e-mail via Mailtrap. Não
  // revela se o e-mail existe: sempre retorna sem erro.
  async solicitarRecuperacaoSenha(email: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } })
    if (!usuario) {
      return
    }

    const token = randomBytes(32).toString('hex')
    const agora = new Date()

    await this.prisma.recuperacaoSenha.create({
      data: {
        id_usuario: usuario.id_usuario,
        token_hash: this.hashToken(token),
        expira_em: new Date(agora.getTime() + RECUPERACAO_TTL_MINUTOS * 60_000),
      },
    })

    try {
      await this.mail.enviarRecuperacaoSenha(usuario.email, {
        token,
        nome: usuario.nome,
        validadeMinutos: RECUPERACAO_TTL_MINUTOS,
      })
    } catch (error) {
      // Falha ao enviar não pode derrubar a requisição (viraria 500 só quando o e-mail existe,
      // o que já entregaria a informação que essa função tenta esconder). Só loga.
      this.logger.error('Falha ao enviar e-mail de recuperação de senha.', error)
    }
  }

  // Task 3, passo 2: confere o token (não usado, não expirado) e troca a senha.
  async redefinirSenha(token: string, novaSenha: string): Promise<void> {
    const recuperacao = await this.prisma.recuperacaoSenha.findUnique({
      where: { token_hash: this.hashToken(token) },
    })

    if (!recuperacao || recuperacao.usado_em || recuperacao.expira_em < new Date()) {
      throw new UnauthorizedException('Código inválido ou expirado.')
    }

    const senha = await bcrypt.hash(novaSenha, SALT_ROUNDS)
    await this.prisma.$transaction([
      this.prisma.recuperacaoSenha.update({
        where: { id: recuperacao.id },
        data: { usado_em: new Date() },
      }),
      this.prisma.usuario.update({ where: { id_usuario: recuperacao.id_usuario }, data: { senha } }),
    ])
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private gerarToken(id_usuario: number, email: string): AutenticacaoResult {
    return { access_token: this.jwt.sign({ sub: id_usuario, email }) }
  }
}
