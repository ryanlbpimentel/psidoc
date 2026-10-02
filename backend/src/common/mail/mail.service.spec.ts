import { Test, TestingModule } from '@nestjs/testing'
import { MAIL_PROVIDER } from './interface/mail.interface'
import { MailService } from './mail.service'

describe('MailService', () => {
  let service: MailService
  let provider: { send: jest.Mock }

  beforeEach(async () => {
    provider = { send: jest.fn().mockResolvedValue(undefined) }
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService, { provide: MAIL_PROVIDER, useValue: provider }],
    }).compile()
    service = module.get(MailService)
  })

  it('monta o e-mail de recuperação de senha e delega pro provider configurado', async () => {
    await service.enviarRecuperacaoSenha('maria@example.com', {
      token: '123456',
      nome: 'Maria Silva',
      validadeMinutos: 15,
    })

    expect(provider.send).toHaveBeenCalledTimes(1)
    const enviado = provider.send.mock.calls[0][0]
    expect(enviado.to).toBe('maria@example.com')
    expect(enviado.message).toContain('123456')
  })
})
