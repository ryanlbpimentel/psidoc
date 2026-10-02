import { Injectable } from '@nestjs/common'
import { MailProvider, TemplateEmail } from './mail.interface'

@Injectable()
export class MailService {
  constructor(private readonly mailProvider: MailProvider) { }

  async enviarRecuperacaoSenha(para: string, nome: string, token: string): Promise<void> {
    await this.mailProvider.enviarEmail(
      para,
      'Redefinição de Senha - PSIDOC',
      TemplateEmail.RECUPERACAO_SENHA,
      { nome, token },
    )
  }

  async enviarCadastroAprovado(para: string, nome: string): Promise<void> {
    await this.mailProvider.enviarEmail(
      para,
      'Cadastro Aprovado - PSIDOC',
      TemplateEmail.CADASTRO_APROVADO,
      { nome },
    )
  }
}