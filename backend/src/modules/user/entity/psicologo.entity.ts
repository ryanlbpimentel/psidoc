import { UsuarioEntity } from './usuario.entity'

export class PsicologoEntity {
  id_psicologo: number
  crp: string
  usuario: UsuarioEntity
}
