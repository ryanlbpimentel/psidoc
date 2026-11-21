import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import { CurrentUser } from '@common/auth/auth.decorator'
import { JwtAuthGuard } from '@common/auth/auth.guard'
import type { JwtPayload } from '@common/auth/auth.guard'
import { ExigirNivel } from '@common/role/role.decorator'
import { RoleGuard } from '@common/role/role.guard'
import { ConsultaService } from './consulta.service'
import { AgendarConsultaDto } from './dto/agendar-consulta.dto'
import { ConsultarAgendaDto } from './dto/consultar-agenda.dto'
import { EnviarLembreteDto } from './dto/enviar-lembrete.dto'

@ApiTags('Consultas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@ExigirNivel(Role.PSICOLOGO)
@Controller('consulta')
export class ConsultaController {
    constructor(private readonly consultaService: ConsultaService) { }

    @Post('agendar')
    @ApiOperation({ summary: 'Agenda uma consulta de 1 hora para um paciente do psicólogo' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Consulta agendada com sucesso.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de validação inválidos.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Paciente não encontrado.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Já existe uma consulta neste horário.' })
    agendarConsulta(
        @CurrentUser() usuario: JwtPayload,
        @Body() dto: AgendarConsultaDto,
    ) {
        return this.consultaService.agendarConsulta(usuario.id_usuario, dto)
    }

    @Get()
    @ApiOperation({ summary: 'Lista as consultas do psicólogo por data e horário, com filtro opcional por período' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Consultas retornadas (lista vazia se não houver nenhuma).' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Período inválido.' })
    consultarAgenda(
        @CurrentUser() usuario: JwtPayload,
        @Query() dto: ConsultarAgendaDto,
    ) {
        return this.consultaService.consultarAgenda(usuario.id_usuario, dto)
    }

    @Post(':id/lembrete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Envia por WhatsApp ou SMS o lembrete da consulta ao telefone do paciente' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Lembrete enviado com sucesso.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Canal inválido ou paciente sem telefone cadastrado.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Consulta não encontrada.' })
    @ApiResponse({ status: HttpStatus.BAD_GATEWAY, description: 'Falha no envio pelo provedor de mensagens.' })
    enviarLembrete(
        @CurrentUser() usuario: JwtPayload,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: EnviarLembreteDto,
    ) {
        return this.consultaService.enviarLembrete(usuario.id_usuario, id, dto)
    }

    @Get('em-andamento')
    @ApiOperation({ summary: 'Lista as consultas em andamento agora, com os minutos restantes e o aviso de término' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Consultas em andamento (lista vazia se não houver nenhuma). "alertar" fica true quando faltam 10 minutos ou menos.',
    })
    consultarEmAndamento(@CurrentUser() usuario: JwtPayload) {
        return this.consultaService.consultarEmAndamento(usuario.id_usuario)
    }

    @Patch(':id/estender')
    @ApiOperation({ summary: 'Estende em 10 minutos a consulta em andamento (uma vez só)' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Consulta estendida com sucesso.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Consulta fora de andamento ou já estendida.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Consulta não encontrada.' })
    estenderConsulta(
        @CurrentUser() usuario: JwtPayload,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.consultaService.estenderConsulta(usuario.id_usuario, id)
    }
}
