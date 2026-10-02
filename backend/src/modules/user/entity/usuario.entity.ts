// Formato de Usuario que pode sair pela API — nunca inclui `senha`.
export class UsuarioEntity {
  id_usuario: number
  nome: string
  email: string
  cpf: string
  telefone: string
  esta_ativo: boolean
  criado_em: Date
  atualizado_em: Date
}
