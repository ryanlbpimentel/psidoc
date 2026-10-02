export interface CadastroAprovadoContext {
    nome: string
}

export function cadastroAprovadoTemplate(context: CadastroAprovadoContext): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cadastro Aprovado - PSIDOC</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f8; color: #333333;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

        <!-- Cabeçalho -->
        <tr>
          <td style="background-color: #003366; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">PSIDOC</h1>
          </td>
        </tr>

        <!-- Conteúdo -->
        <tr>
          <td style="padding: 32px 28px; line-height: 1.6;">
            <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Parabéns, ${context.nome}!</h2>
            <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">
              Seu cadastro profissional de psicólogo no <strong>PSIDOC</strong> foi validado e aprovado com sucesso.
            </p>

            <!-- Box de Conta Ativa -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px; margin: 20px 0;">
              <tr>
                <td style="padding: 14px 18px; font-size: 14px; color: #166534;">
                  <strong>Conta Ativa:</strong> Sua conta já está liberada e você possui permissão total para acessar o sistema.
                </td>
              </tr>
            </table>

            <!-- Box de Instrução -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
              <tr>
                <td style="padding: 16px 20px;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b; font-size: 14px;">Como acessar:</p>
                  <p style="margin: 0; font-size: 14px; color: #475569;">
                    Abra o aplicativo <strong>PSIDOC</strong> no seu computador e faça login com seu e-mail e senha cadastrados.
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size: 13px; color: #64748b; margin-top: 24px; margin-bottom: 0;">
              Caso tenha alguma dúvida no primeiro acesso, entre em contato com a equipe de suporte.
            </p>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td style="background-color: #f9fafb; padding: 16px 24px; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb;">
            Este é um e-mail automático enviado pelo PSIDOC. Por favor, não responda.
          </td>
        </tr>

      </table>
    </body>
    </html>
      `
}