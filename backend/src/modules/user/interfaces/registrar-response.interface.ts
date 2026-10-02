export interface RegistrarResponse {
  access_token?: string
  validado: 'APROVADO' | 'PENDENTE'
  mensagem: string
}