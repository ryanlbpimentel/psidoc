import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put,
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
import { PacienteService } from './paciente.service'
import { CadastrarPacienteDto } from './dto/cadastrar-paciente.dto'
import { ConsultarPacienteDto } from './dto/consultar-paciente.dto'
import { AtualizarPacienteDto } from './dto/atualizar-paciente.dto'
import { AtualizarEnderecoDto } from './dto/atualizar-endereco.dto'
import { CadastrarResponsavelDto } from './dto/cadastrar-responsavel.dto'
import { AtualizarResponsavelDto } from './dto/atualizar-responsavel.dto'
import { ExcluirPacienteDto } from './dto/excluir-paciente.dto'

@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@ExigirNivel(Role.PSICOLOGO)
@Controller('paciente')
export class PacienteController {
    constructor(private readonly pacienteService: PacienteService) { }

    @Post('cadastrar')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Cadastra um novo paciente inicialmente apenas com nome e data de nascimento' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Paciente cadastrado com sucesso.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados de validação inválidos.' })
    cadastrarPaciente(
        @CurrentUser() usuario: JwtPayload,
        @Body() dto: CadastrarPacienteDto,
    ) {
        return this.pacienteService.cadastrarPaciente(usuario.id_usuario, dto)
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Lista os pacientes com filtros, busca e paginação padronizada' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Lista paginada de pacientes retornada com sucesso.' })
    consultarPaciente(
        @CurrentUser() usuario: JwtPayload,
        @Query() dto: ConsultarPacienteDto,
    ) {
        return this.pacienteService.consultarPaciente(usuario.id_usuario, dto)
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Consulta os dados completos de um paciente pelo ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Paciente retornado com sucesso.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Paciente não encontrado.' })
    consultarPacientePorId(
        @CurrentUser() usuario: JwtPayload,
        @Param('id') id: number,
    ) {
        return this.pacienteService.consultarPacientePorId(usuario.id_usuario, id)
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Atualiza os dados pessoais ou clínicos do paciente' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Paciente atualizado com sucesso.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Paciente não encontrado.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'CPF já em uso por outro paciente.' })
    atualizarPaciente(
        @CurrentUser() usuario: JwtPayload,
        @Param('id') id: number,
        @Body() dto: AtualizarPacienteDto,
    ) {
        return this.pacienteService.atualizarPaciente(usuario.id_usuario, id, dto)
    }

    @Put(':id/endereco')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cadastra ou atualiza o endereço residencial do paciente' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Endereço salvo com sucesso.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Paciente não encontrado.' })
    cadastrarEndereco(
        @CurrentUser() usuario: JwtPayload,
        @Param('id') id: number,
        @Body() dto: AtualizarEnderecoDto,
    ) {
        return this.pacienteService.cadastrarEndereco(usuario.id_usuario, id, dto)
    }

    @Post(':id/responsavel')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Adiciona e vincula um responsável legal ao paciente (máximo de 3)' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Responsável vinculado com sucesso.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Paciente não encontrado.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Responsável já vinculado a este paciente.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Limite de responsáveis atingido ou dados inválidos.' })
    adicionarResponsavel(
        @CurrentUser() usuario: JwtPayload,
        @Param('id') id: number,
        @Body() dto: CadastrarResponsavelDto,
    ) {
        return this.pacienteService.cadastrarResponsavel(usuario.id_usuario, id, dto)
    }

    @Patch(':id/responsavel/:idResponsavel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Atualiza os dados ou o parentesco de um responsável vinculado' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Responsável atualizado com sucesso.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Vínculo ou responsável não encontrado.' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'CPF já em uso por outro responsável.' })
    atualizarResponsavel(
        @CurrentUser() usuario: JwtPayload,
        @Param('id') id: number,
        @Param('idResponsavel') idResponsavel: number,
        @Body() dto: AtualizarResponsavelDto,
    ) {
        return this.pacienteService.atualizarResponsavel(usuario.id_usuario, id, idResponsavel, dto)
    }

    @Delete(':id/responsavel/:idResponsavel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove o vínculo de um responsável com o paciente' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Responsável desvinculado com sucesso.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Vínculo não encontrado.' })
    excluirResponsavel(
        @CurrentUser() usuario: JwtPayload,
        @Param('id') id: number,
        @Param('idResponsavel') idResponsavel: number,
    ) {
        return this.pacienteService.excluirResponsavel(usuario.id_usuario, id, idResponsavel)
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove permanentemente o paciente (necessário estar arquivado)' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Paciente excluído com sucesso.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Paciente não encontrado.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Paciente ativo não pode ser excluído.' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Senha incorreta.' })
    excluirPaciente(@CurrentUser() usuario: JwtPayload,@Param('id') id: number, @Body() dto: ExcluirPacienteDto) {
        return this.pacienteService.excluirPaciente(usuario.id_usuario, id, dto)
    }
}
