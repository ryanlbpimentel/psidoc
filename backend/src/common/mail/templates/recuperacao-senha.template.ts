export interface RecuperacaoSenhaContext {
    nome: string
    token: string
}

export function recuperacaoSenhaTemplate(context: RecuperacaoSenhaContext): string {
    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha - PSIDOC</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .header { background: #003366; color: #ffffff; padding: 24px; text-align: center; }
            .content { padding: 32px 24px; line-height: 1.6; }
            .alert-box { background-color: #fff8e6; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #92400e;}
            .footer { background: #f9fafb; padding: 16px 24px; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 22px;">PSIDOC</h1>
            </div>
            <div class="content">
              <h2>Olá, ${context.nome}!</h2>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no aplicativo <strong>PSIDOC</strong>.</p>
              <p>Copie o token de recuperação abaixo e utilize-o no aplicativo para definir sua nova senha:</p>

              <div style="background-color: #f1f5f9; border: 2px dashed #0066cc; color: #003366; padding: 16px; margin: 24px 0; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold; text-align: center; word-break: break-all; overflow-wrap: anywhere;">
                ${context.token}
              </div>

              <div class="alert-box">
                <strong>Atenção:</strong> Por motivos de segurança, este token é válido por apenas <strong>15 minutos</strong> e pode ser utilizado somente uma vez.
              </div>

              <p style="font-size: 13px; color: #666;">
                Se você <strong>não</strong> solicitou a redefinição de sua senha, desconsidere este e-mail. Sua senha atual continuará em vigor e nenhuma alteração será realizada.
              </p>
            </div>
            <div class="footer">
              Este é um e-mail automático enviado pelo PSIDOC. Por favor, não responda.
            </div>
          </div>
        </body>
        </html>
      `
}