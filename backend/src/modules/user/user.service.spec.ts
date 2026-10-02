import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import { PrismaService } from '@common/prisma/prisma.service'
import { MailService } from '@common/mail/mail.service'
import { UserService } from './user.service'
import { LoginDto, RegistrarUsuarioDto } from './dto/user.dto'

type PrismaMock = {
  usuario: { findUnique: jest.Mock; update: jest.Mock }
  recuperacaoSenha: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock }
  $transaction: jest.Mock
}

const dtoRegistro: RegistrarUsuarioDto = {
  nome: 'Maria Silva Souza',
  email: 'maria@example.com',
  cpf: '52998224725',
  telefone: '85999998888',
  senha: 'Senha1234',
  crp: '11/12345',
}

describe('UserService', () => {
  let service: UserService
  let prisma: PrismaMock
  let jwt: { sign: jest.Mock }
  let mail: { enviarRecuperacaoSenha: jest.Mock }

  beforeEach(async () => {
    prisma = {
      usuario: { findUnique: jest.fn(), update: jest.fn() },
      recuperacaoSenha: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    }
    jwt = { sign: jest.fn().mockReturnValue('token-fake') }
    mail = { enviarRecuperacaoSenha: jest.fn().mockResolvedValue(undefined) }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: MailService, useValue: mail },
      ],
    }).compile()

    service = module.get(UserService)
  })

  describe('registrar (US01)', () => {
    it('cria usuario e psicologo numa transação e devolve o token', async () => {
      const criarPsicologo = jest.fn().mockResolvedValue({})
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
        fn({
          usuario: {
            create: jest.fn().mockResolvedValue({ id_usuario: 1, email: dtoRegistro.email }),
          },
          psicologo: { create: criarPsicologo },
        }),
      )

      const result = await service.registrar(dtoRegistro)

      expect(result).toEqual({ access_token: 'token-fake' })
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 1, email: dtoRegistro.email })
      expect(criarPsicologo).toHaveBeenCalledWith({ data: { id_usuario: 1, crp: dtoRegistro.crp } })
    })

    it('lança ConflictException quando e-mail, CPF ou CRP já existem (violação de unicidade)', async () => {
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('já existe', { code: 'P2002', clientVersion: 'x' }),
      )

      await expect(service.registrar(dtoRegistro)).rejects.toBeInstanceOf(ConflictException)
    })

    it('propaga qualquer outro erro inesperado', async () => {
      const falha = new Error('banco fora do ar')
      prisma.$transaction.mockRejectedValue(falha)

      await expect(service.registrar(dtoRegistro)).rejects.toBe(falha)
    })

    it('a senha nunca é gravada em claro (vira hash bcrypt)', async () => {
      let senhaGravada = ''
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
        fn({
          usuario: {
            create: jest.fn(({ data }: { data: { email: string; senha: string } }) => {
              senhaGravada = data.senha
              return Promise.resolve({ id_usuario: 1, email: data.email })
            }),
          },
          psicologo: { create: jest.fn().mockResolvedValue({}) },
        }),
      )

      await service.registrar(dtoRegistro)

      expect(senhaGravada).not.toBe(dtoRegistro.senha)
      await expect(bcrypt.compare(dtoRegistro.senha, senhaGravada)).resolves.toBe(true)
    })
  })

  describe('login (US03)', () => {
    const credenciais: LoginDto = { email: 'maria@example.com', senha: 'Senha1234' }

    it('devolve o token quando a senha confere', async () => {
      const senha = await bcrypt.hash('Senha1234', 4)
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, email: credenciais.email, senha })

      await expect(service.login(credenciais)).resolves.toEqual({ access_token: 'token-fake' })
    })

    it('recusa quando o usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null)
      await expect(service.login(credenciais)).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('recusa quando a senha está errada', async () => {
      const senha = await bcrypt.hash('Senha1234', 4)
      prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, email: credenciais.email, senha })

      await expect(service.login({ ...credenciais, senha: 'errada' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })
  })

  describe('solicitarRecuperacaoSenha (US04, passo 1)', () => {
    it('cria o token e manda o e-mail quando o usuário existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id_usuario: 1,
        email: 'maria@example.com',
        nome: 'Maria Silva Souza',
      })

      await service.solicitarRecuperacaoSenha('maria@example.com')

      expect(prisma.recuperacaoSenha.create).toHaveBeenCalledTimes(1)
      expect(mail.enviarRecuperacaoSenha).toHaveBeenCalledWith(
        'maria@example.com',
        expect.objectContaining({ nome: 'Maria Silva Souza', validadeMinutos: 15 }),
      )
    })

    it('não revela nada quando o usuário não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null)

      await service.solicitarRecuperacaoSenha('ninguem@example.com')

      expect(prisma.recuperacaoSenha.create).not.toHaveBeenCalled()
      expect(mail.enviarRecuperacaoSenha).not.toHaveBeenCalled()
    })

    it('não deixa a requisição quebrar se o envio do e-mail falhar', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id_usuario: 1,
        email: 'maria@example.com',
        nome: 'Maria Silva Souza',
      })
      mail.enviarRecuperacaoSenha.mockRejectedValue(new Error('Mailtrap fora do ar'))

      await expect(service.solicitarRecuperacaoSenha('maria@example.com')).resolves.toBeUndefined()
    })
  })

  describe('redefinirSenha (US04, passo 2)', () => {
    it('recusa um token que não existe', async () => {
      prisma.recuperacaoSenha.findUnique.mockResolvedValue(null)

      await expect(service.redefinirSenha('token-invalido', 'NovaSenha99')).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('recusa um token já usado', async () => {
      prisma.recuperacaoSenha.findUnique.mockResolvedValue({
        id: 1,
        id_usuario: 1,
        usado_em: new Date(),
        expira_em: new Date(Date.now() + 60_000),
      })

      await expect(service.redefinirSenha('token', 'NovaSenha99')).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('recusa um token expirado', async () => {
      prisma.recuperacaoSenha.findUnique.mockResolvedValue({
        id: 1,
        id_usuario: 1,
        usado_em: null,
        expira_em: new Date(Date.now() - 1000),
      })

      await expect(service.redefinirSenha('token', 'NovaSenha99')).rejects.toBeInstanceOf(
        UnauthorizedException,
      )
    })

    it('troca a senha e marca o token como usado quando tudo confere', async () => {
      prisma.recuperacaoSenha.findUnique.mockResolvedValue({
        id: 1,
        id_usuario: 1,
        usado_em: null,
        expira_em: new Date(Date.now() + 60_000),
      })
      prisma.$transaction.mockResolvedValue(undefined)

      await service.redefinirSenha('token-valido', 'NovaSenha99')

      expect(prisma.recuperacaoSenha.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      )
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_usuario: 1 } }),
      )
      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    })
  })
})
