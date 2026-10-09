import { SetMetadata } from '@nestjs/common'
import { Role } from '@prisma/client'

export const ROLE_KEY = 'role'

export const ExigirNivel = (nivel: Role) => SetMetadata(ROLE_KEY, nivel)