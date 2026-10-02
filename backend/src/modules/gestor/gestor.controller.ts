import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserService } from '@modules/user/user.service'
import { CurrentUser } from '@common/jwt/jwt.decorator'
import { JwtAuthGuard } from '@common/jwt/jwt.guard'
import type { JwtPayload } from '@common/jwt/jwt.guard'
import { ExigirNivel } from '@common/rbac/rbac.decorator'
import { NivelPermissaoGuard } from '@common/rbac/rbac.guard'
import { NivelPermissao } from '@common/rbac/rbac.enum'
import { GestorService } from './gestor.service'

@ApiTags('Gestores')
@Controller('gestor')
export class GestorController {
    constructor(
        private readonly userService: UserService,
        private readonly gestorService: GestorService,
    ) { }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, NivelPermissaoGuard)
    @ExigirNivel(NivelPermissao.GESTOR)
    @ApiOperation({ summary: 'Listar psicólogos com validação pendente' })
    @ApiResponse({ status: 200, description: 'Lista de psicólogos pendentes retornada com sucesso.' })
    @Get('/psicologo/pendentes')
    async listarPendentes() {
        return this.gestorService.listarPendentes()
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, NivelPermissaoGuard)
    @ExigirNivel(NivelPermissao.GESTOR)
    @ApiOperation({ summary: 'Aprovar manualmente o cadastro de um psicólogo' })
    @ApiResponse({ status: 200, description: 'Psicólogo aprovado com sucesso.' })
    @ApiResponse({ status: 404, description: 'Psicólogo não encontrado.' })
    @ApiResponse({ status: 400, description: 'Psicólogo já se encontra aprovado.' })
    @Patch('psicologo/:id/aprovar')
    async aprovarPsicologo(@Param('id', ParseIntPipe) id_usuario: number) {
        return this.gestorService.aprovarPsicologo(id_usuario)
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, NivelPermissaoGuard)
    @ExigirNivel(NivelPermissao.GESTOR)
    @ApiOperation({ summary: 'Reprovar e remover cadastro de psicólogo' })
    @ApiResponse({ status: 200, description: 'Psicólogo reprovado e removido com sucesso.' })
    @ApiResponse({ status: 404, description: 'Psicólogo não encontrado.' })
    @ApiResponse({ status: 400, description: 'Psicólogo já se encontra aprovado.' })
    @Delete('psicologo/:id/reprovar')
    async reprovarPsicologo(@Param('id', ParseIntPipe) id_usuario: number) {
        return this.gestorService.reprovarPsicologo(id_usuario)
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, NivelPermissaoGuard)
    @ExigirNivel(NivelPermissao.GESTOR)
    @ApiOperation({ summary: 'Encerrar sessão do usuário por ID' })
    @ApiResponse({ status: 200, description: 'Sessão encerrada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
    @ApiResponse({ status: 400, description: 'ID do usuário é obrigatório.' })
    @Post('usuario/encerrar-sessao/:id')
    async encerrarSessaoById(
        @Param('id', ParseIntPipe) id_usuario: number,
        @CurrentUser() usuario: JwtPayload,
    ) {
        if (!id_usuario) {
            throw new BadRequestException('ID do usuário é obrigatório')
        }

        if (id_usuario === usuario.id_usuario) {
            throw new BadRequestException('Não é possível encerrar a própria sessão desta maneira.')
        }

        return this.userService.encerrarSessao(id_usuario)
    }
}