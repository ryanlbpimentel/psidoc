import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { ROLE_KEY } from './role.decorator'

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const roleExigido = this.reflector.getAllAndOverride<Role>(ROLE_KEY, [context.getHandler(), context.getClass()],)

        if (roleExigido === undefined || roleExigido === null) {
            return true
        }

        const request = context.switchToHttp().getRequest()
        const usuario = request.user

        if (!usuario) {
            throw new UnauthorizedException('Usuário não autenticado.')
        }

        const rolesUsuario = usuario.roles ?? []

        for (const role of rolesUsuario) {
            if (role === roleExigido) {
                return true
            }
        }

        throw new ForbiddenException(
            'Acesso negado: você não possui permissão suficiente para acessar este recurso.',
        )
    }
}
