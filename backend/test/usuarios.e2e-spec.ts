import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/common/prisma/prisma.service'
import { MAIL_PROVIDER } from '../src/common/mail/interface/mail.interface'
import type { MailMessage, MailProvider } from '../src/common/mail/interface/mail.interface'

// Fake do provider de e-mail: guarda as mensagens em memória, pra poder pegar o token de
// recuperação (que só existe em claro no e-mail — nunca é persistido) sem precisar de um
// Mailtrap de verdade no teste.
class FakeMailProvider implements MailProvider {
  readonly enviados: MailMessage[] = []

  send(mail: MailMessage): Promise<void> {
    this.enviados.push(mail)
    return Promise.resolve()
  }

  ultimoToken(): string {
    const ultimo = this.enviados[this.enviados.length - 1]
    const token = ultimo?.context?.token
    if (typeof token !== 'string') {
      throw new Error('Nenhum token de recuperação foi enviado.')
    }
    return token
  }
}

describe('Usuários (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService
  let mailProvider: FakeMailProvider

  const registro = {
    nome: 'Maria Silva Souza',
    email: 'maria@example.com',
    cpf: '52998224725',
    telefone: '85999998888',
    senha: 'Senha1234',
    crp: '11/12345',
  }

  beforeAll(async () => {
    mailProvider = new FakeMailProvider()
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAIL_PROVIDER)
      .useValue(mailProvider)
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    prisma = moduleFixture.get(PrismaService)
  })

  beforeEach(async () => {
    await prisma.recuperacaoSenha.deleteMany()
    await prisma.psicologo.deleteMany()
    await prisma.usuario.deleteMany()
    mailProvider.enviados.length = 0
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /usuarios/registrar cria o usuário e o psicólogo e devolve um token', async () => {
    const resposta = await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)

    expect(resposta.status).toBe(201)
    expect(resposta.body.access_token).toEqual(expect.any(String))

    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email: registro.email } })
    expect(usuario.senha).not.toBe(registro.senha)
    const psicologo = await prisma.psicologo.findUnique({ where: { id_usuario: usuario.id_usuario } })
    expect(psicologo?.crp).toBe(registro.crp)
  })

  it('não permite dois cadastros com o mesmo e-mail', async () => {
    await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)

    const resposta = await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)

    expect(resposta.status).toBe(409)
  })

  it('recusa cadastro com dados inválidos', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/usuarios/registrar')
      .send({ email: 'nao-e-email' })

    expect(resposta.status).toBe(400)
  })

  it('POST /usuarios/login entra com e-mail e senha corretos', async () => {
    await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)

    const resposta = await request(app.getHttpServer())
      .post('/usuarios/login')
      .send({ email: registro.email, senha: registro.senha })

    expect(resposta.status).toBe(200)
    expect(resposta.body.access_token).toEqual(expect.any(String))
  })

  it('POST /usuarios/login recusa senha errada', async () => {
    await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)

    const resposta = await request(app.getHttpServer())
      .post('/usuarios/login')
      .send({ email: registro.email, senha: 'senha-errada' })

    expect(resposta.status).toBe(401)
  })

  it('POST /usuarios/esqueci-senha responde igual para e-mail existente e inexistente', async () => {
    await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)

    const existente = await request(app.getHttpServer())
      .post('/usuarios/esqueci-senha')
      .send({ email: registro.email })
    const inexistente = await request(app.getHttpServer())
      .post('/usuarios/esqueci-senha')
      .send({ email: 'ninguem@example.com' })

    expect(existente.status).toBe(202)
    expect(inexistente.status).toBe(202)
    expect(existente.body).toEqual(inexistente.body)
    expect(mailProvider.enviados).toHaveLength(1) // só o existente dispara e-mail
  })

  it('fluxo completo: pede o código, redefine a senha e entra com a nova senha', async () => {
    await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)
    await request(app.getHttpServer()).post('/usuarios/esqueci-senha').send({ email: registro.email })
    const token = mailProvider.ultimoToken()

    const redefinir = await request(app.getHttpServer())
      .post('/usuarios/redefinir-senha')
      .send({ token, novaSenha: 'NovaSenha99' })

    expect(redefinir.status).toBe(200)

    const comSenhaAntiga = await request(app.getHttpServer())
      .post('/usuarios/login')
      .send({ email: registro.email, senha: registro.senha })
    const comSenhaNova = await request(app.getHttpServer())
      .post('/usuarios/login')
      .send({ email: registro.email, senha: 'NovaSenha99' })

    expect(comSenhaAntiga.status).toBe(401)
    expect(comSenhaNova.status).toBe(200)
  })

  it('o código de recuperação só funciona uma vez', async () => {
    await request(app.getHttpServer()).post('/usuarios/registrar').send(registro)
    await request(app.getHttpServer()).post('/usuarios/esqueci-senha').send({ email: registro.email })
    const token = mailProvider.ultimoToken()
    await request(app.getHttpServer())
      .post('/usuarios/redefinir-senha')
      .send({ token, novaSenha: 'NovaSenha99' })

    const resposta = await request(app.getHttpServer())
      .post('/usuarios/redefinir-senha')
      .send({ token, novaSenha: 'OutraSenha77' })

    expect(resposta.status).toBe(401)
  })

  it('redefinir-senha recusa token inexistente', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/usuarios/redefinir-senha')
      .send({ token: 'token-que-nao-existe', novaSenha: 'NovaSenha99' })

    expect(resposta.status).toBe(401)
  })
})
