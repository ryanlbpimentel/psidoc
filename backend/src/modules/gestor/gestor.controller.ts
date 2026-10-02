import { Controller, Post, BadRequestException, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { UserService } from '@modules/user/user.service'
import { CurrentUser } from '@common/jwt/jwt.decorator'
import { JwtAuthGuard } from '@common/jwt/jwt.guard'
import type { JwtPayload } from '@common/jwt/jwt.guard'
import { ExigirNivel } from '@common/rbac/rbac.decorator'
import { NivelPermissaoGuard } from '@common/rbac/rbac.guard'
import { NivelPermissao } from '@common/rbac/rbac.enum'

@ApiTags('Gestores')
@Controller('gestores')
export class GestorController {
    constructor(private readonly userService: UserService) { }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, NivelPermissaoGuard)
    @ExigirNivel(NivelPermissao.GESTOR)
    @ApiOperation({ summary: 'Encerrar sessão do usuário por ID' })
    @ApiResponse({ status: 200, description: 'Sessão encerrada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
    @ApiResponse({ status: 400, description: 'ID do usuário é obrigatório.' })
    @Post('encerrar-sessao/:id')
    async encerrarSessaoById(@Param('id', ParseIntPipe) id_usuario: number, @CurrentUser() usuario: JwtPayload) {
        if (!id_usuario) {
            throw new BadRequestException('ID do usuário é obrigatório')
        }

        if (id_usuario === usuario.id_usuario) {
            throw new BadRequestException('Não é possível encerrar a própria sessão desta maneira.')
        }

        await this.userService.encerrarSessao(id_usuario)
    }
}