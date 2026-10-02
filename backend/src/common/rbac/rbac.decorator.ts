import { SetMetadata } from '@nestjs/common'
import { NivelPermissao } from './rbac.enum'

export const NIVEL_PERMISSAO_KEY = 'nivel_permissao'

export const ExigirNivel = (nivel: NivelPermissao) => SetMetadata(NIVEL_PERMISSAO_KEY, nivel)