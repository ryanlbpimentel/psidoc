import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { NivelPermissao } from './rbac.enum'
import { NIVEL_PERMISSAO_KEY } from './rbac.decorator'

@Injectable()
export class NivelPermissaoGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const nivelExigido = this.reflector.getAllAndOverride<NivelPermissao>(NIVEL_PERMISSAO_KEY, [context.getHandler(), context.getClass()],)

        if (nivelExigido === undefined || nivelExigido === null || nivelExigido === NivelPermissao.PUBLICO) {
            return true
        }

        const request = context.switchToHttp().getRequest()
        const usuario = request.user

        if (!usuario) {
            throw new UnauthorizedException('Usuário não autenticado.')
        }

        const nivelUsuario = usuario.nivel_permissao ?? NivelPermissao.PUBLICO

        if (nivelUsuario < nivelExigido) {
            throw new ForbiddenException(
                'Acesso negado: você não possui permissão suficiente para acessar este recurso.',
            )
        }

        return true
    }
}