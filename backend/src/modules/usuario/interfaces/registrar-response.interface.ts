export interface RegistrarResponse {
  access_token?: string
  validado: 'APROVADO' | 'PENDENTE' | 'EM_ANALISE'
  mensagem: string
}