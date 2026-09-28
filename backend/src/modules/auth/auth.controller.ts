import { Controller, Post, Body, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EncerrarSessaoDto } from './dto/encerrar-sessao.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiOperation({ summary: 'Encerrar sessão do usuário' })
    @ApiResponse({ status: 200, description: 'Sessão encerrada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
    @ApiResponse({ status: 400, description: 'ID do usuário é obrigatório.' })
    @Post('encerrar-sessao')
    async encerrarSessao(@Body() dto: EncerrarSessaoDto) {
        const { id_usuario } = dto;

        if (!dto.id_usuario) {
            throw new BadRequestException('ID do usuário é obrigatório');
        }

        await this.authService.encerrarSessao(id_usuario);
    }

    @ApiOperation({ summary: 'Encerrar sessão do usuário por ID' })
    @ApiResponse({ status: 200, description: 'Sessão encerrada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
    @ApiResponse({ status: 400, description: 'ID do usuário é obrigatório.' })
    @Post('encerrar-sessao/:id')
    async encerrarSessaoById(@Param('id', ParseIntPipe) id_usuario: number) {
        if (!id_usuario) {
            throw new BadRequestException('ID do usuário é obrigatório');
        }

        await this.authService.encerrarSessao(id_usuario);
    }
}