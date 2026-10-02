import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { UserService } from '@modules/user/user.service'

export interface JwtPayload {
    id_usuario: number
    email: string
    token_version: number
    nivel_permissao: number
    iat?: Date
    exp?: Date
}

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
        const token = this.extrairTokenDoHeader(request)

        if (!token) {
            throw new UnauthorizedException('Token de autenticação não fornecido.')
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
                secret: process.env.JWT_SECRET,
            })

            const versaoValida = await this.userService.validarVersaoToken(
                payload.id_usuario,
                payload.token_version,
            )

            if (!versaoValida) {
                throw new UnauthorizedException(
                    'Sessão encerrada ou expirada. Por favor, faça login novamente.',
                )
            }

            request.user = payload
            return true
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error
            }
            throw new UnauthorizedException('Token inválido ou expirado.')
        }
    }

    private extrairTokenDoHeader(request: Request): string | undefined {
        const [tipo, token] = request.headers.authorization?.split(' ') ?? []
        return tipo === 'Bearer' ? token : undefined
    }
}