import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { Prisma, StatusPaciente } from '@prisma/client'
import { PrismaService } from '@common/prisma/prisma.service'
import { paginarPrisma } from '@common/pagination/pagination.util'

import { ConsultarPacienteDto } from './dto/consultar-paciente.dto'
import { CadastrarPacienteDto } from './dto/cadastrar-paciente.dto'
import { CadastrarResponsavelDto } from './dto/cadastrar-responsavel.dto'
import { AtualizarPacienteDto } from './dto/atualizar-paciente.dto'
import { AtualizarEnderecoDto } from './dto/atualizar-endereco.dto'
import { AtualizarResponsavelDto } from './dto/atualizar-responsavel.dto'
import { ExcluirPacienteDto } from './dto/excluir-paciente.dto'

@Injectable()
export class PacienteService {
    constructor(private readonly prisma: PrismaService) { }

    async cadastrarPaciente(idPsicologo: number, dto: CadastrarPacienteDto) {
        return this.prisma.paciente.create({
            data: {
                id_psicologo: idPsicologo,
                nome: dto.nome,
                data_nascimento: new Date(dto.data_nascimento),
                status: StatusPaciente.ATIVO,
            },
            include: {
                endereco: true,
                responsaveis: {
                    include: {
                        responsavel: true,
                    },
                },
            },
        })
    }

    async consultarPaciente(idPsicologo: number, dto: ConsultarPacienteDto) {
        const where: Prisma.PacienteWhereInput = {
            id_psicologo: idPsicologo,
        }

        if (dto.status) {
            where.status = dto.status
        }

        if (dto.busca) {
            where.OR = [
                { nome: { contains: dto.busca, mode: 'insensitive' } },
                { cpf: { contains: dto.busca } },
            ]
        }

        return paginarPrisma(
            this.prisma.paciente,
            {
                where,
                orderBy: { nome: 'asc' },
                include: {
                    endereco: {
                        select: { municipio: true, estado: true },
                    },
                },
            },
            dto,
        )
    }

    async consultarPacientePorId(idPsicologo: number, idPaciente: number) {
        const paciente = await this.prisma.paciente.findFirst({
            where: {
                id_paciente: idPaciente,
                id_psicologo: idPsicologo,
            },
            include: {
                endereco: true,
                responsaveis: {
                    include: {
                        responsavel: {
                            include: { endereco: true },
                        },
                    },
                },
            },
        })

        if (!paciente) {
            throw new NotFoundException('Paciente não encontrado.')
        }

        return paciente
    }

    async atualizarPaciente(idPsicologo: number, idPaciente: number, dto: AtualizarPacienteDto) {
        const paciente = await this.prisma.paciente.findFirst({
            where: {
                id_paciente: idPaciente,
                id_psicologo: idPsicologo,
            },
        })

        if (!paciente) {
            throw new NotFoundException('Paciente não encontrado.')
        }

        if (dto.cpf && dto.cpf !== paciente.cpf) {
            const cpfEmUso = await this.prisma.paciente.findUnique({
                where: { cpf: dto.cpf },
            })
            if (cpfEmUso) {
                throw new ConflictException('Já existe um paciente cadastrado com este CPF.')
            }
        }

        return this.prisma.paciente.update({
            where: { id_paciente: idPaciente },
            data: {
                nome: dto.nome,
                data_nascimento: dto.data_nascimento ? new Date(dto.data_nascimento) : undefined,
                telefone: dto.telefone,
                cpf: dto.cpf,
                genero: dto.genero,
                status: dto.status,
                renda_familiar: dto.renda_familiar,
                observacoes: dto.observacoes,
            },
            include: {
                endereco: true,
                responsaveis: {
                    include: {
                        responsavel: true,
                    },
                },
            },
        })
    }

    async cadastrarEndereco(idPsicologo: number, idPaciente: number, dto: AtualizarEnderecoDto) {
        const paciente = await this.prisma.paciente.findFirst({
            where: {
                id_paciente: idPaciente,
                id_psicologo: idPsicologo,
            },
        })

        if (!paciente) {
            throw new NotFoundException('Paciente não encontrado.')
        }

        return this.prisma.$transaction(async (tx) => {
            if (paciente.id_endereco) {
                return tx.endereco.update({
                    where: { id_endereco: paciente.id_endereco },
                    data: dto,
                })
            }

            const novoEndereco = await tx.endereco.create({
                data: {
                    logradouro: dto.logradouro ?? '',
                    numero: dto.numero ?? '',
                    complemento: dto.complemento,
                    bairro: dto.bairro ?? '',
                    municipio: dto.municipio ?? '',
                    estado: dto.estado ?? '',
                    cep: dto.cep ?? '',
                },
            })

            await tx.paciente.update({
                where: { id_paciente: idPaciente },
                data: { id_endereco: novoEndereco.id_endereco },
            })

            return novoEndereco
        })
    }

    async cadastrarResponsavel(idPsicologo: number, idPaciente: number, dto: CadastrarResponsavelDto) {
        const paciente = await this.prisma.paciente.findFirst({
            where: {
                id_paciente: idPaciente,
                id_psicologo: idPsicologo,
            },
            include: { responsaveis: true },
        })

        if (!paciente) {
            throw new NotFoundException('Paciente não encontrado.')
        }

        if (paciente.responsaveis.length >= 3) {
            throw new BadRequestException('Um paciente pode ter no máximo 3 responsáveis legais vinculados.')
        }

        return this.prisma.$transaction(async (tx) => {
            let responsavel = await tx.responsavelLegal.findUnique({
                where: { cpf: dto.cpf },
            })

            if (!responsavel) {
                let idEnderecoResp = paciente.id_endereco

                if (dto.endereco) {
                    const novoEndereco = await tx.endereco.create({
                        data: {
                            logradouro: dto.endereco.logradouro ?? '',
                            numero: dto.endereco.numero ?? '',
                            complemento: dto.endereco.complemento,
                            bairro: dto.endereco.bairro ?? '',
                            municipio: dto.endereco.municipio ?? '',
                            estado: dto.endereco.estado ?? '',
                            cep: dto.endereco.cep ?? '',
                        },
                    })
                    idEnderecoResp = novoEndereco.id_endereco
                }

                if (!idEnderecoResp) {
                    throw new BadRequestException('É necessário informar o endereço do responsável quando o paciente não possui endereço cadastrado.')
                }

                responsavel = await tx.responsavelLegal.create({
                    data: {
                        nome: dto.nome,
                        data_nascimento: new Date(dto.data_nascimento),
                        telefone: dto.telefone,
                        cpf: dto.cpf,
                        email: dto.email,
                        id_endereco: idEnderecoResp,
                    },
                })
            }

            const vinculoExistente = await tx.vinculoPacienteResponsavel.findUnique({
                where: {
                    id_paciente_id_responsavel: {
                        id_paciente: idPaciente,
                        id_responsavel: responsavel.id_responsavel,
                    },
                },
            })

            if (vinculoExistente) {
                throw new ConflictException('Este responsável já está vinculado a este paciente.')
            }

            await tx.vinculoPacienteResponsavel.create({
                data: {
                    id_paciente: idPaciente,
                    id_responsavel: responsavel.id_responsavel,
                    parentesco: dto.parentesco,
                },
            })

            return this.consultarPacientePorId(idPsicologo, idPaciente)
        })
    }

    async atualizarResponsavel(
        idPsicologo: number,
        idPaciente: number,
        idResponsavel: number,
        dto: AtualizarResponsavelDto,
    ) {
        const vinculo = await this.prisma.vinculoPacienteResponsavel.findFirst({
            where: {
                id_paciente: idPaciente,
                id_responsavel: idResponsavel,
                paciente: { id_psicologo: idPsicologo },
            },
            include: { responsavel: true },
        })

        if (!vinculo) {
            throw new NotFoundException('Vínculo com o responsável não encontrado.')
        }

        if (dto.cpf && dto.cpf !== vinculo.responsavel.cpf) {
            const cpfEmUso = await this.prisma.responsavelLegal.findUnique({
                where: { cpf: dto.cpf },
            })
            if (cpfEmUso) {
                throw new ConflictException('Já existe um responsável cadastrado com este CPF.')
            }
        }

        return this.prisma.$transaction(async (tx) => {
            if (dto.parentesco) {
                await tx.vinculoPacienteResponsavel.update({
                    where: { id_vinculo: vinculo.id_vinculo },
                    data: { parentesco: dto.parentesco },
                })
            }

            if (dto.endereco) {
                await tx.endereco.update({
                    where: { id_endereco: vinculo.responsavel.id_endereco },
                    data: dto.endereco,
                })
            }

            await tx.responsavelLegal.update({
                where: { id_responsavel: idResponsavel },
                data: {
                    nome: dto.nome,
                    data_nascimento: dto.data_nascimento ? new Date(dto.data_nascimento) : undefined,
                    telefone: dto.telefone,
                    cpf: dto.cpf,
                    email: dto.email,
                },
            })

            return this.consultarPacientePorId(idPsicologo, idPaciente)
        })
    }

    async excluirResponsavel(idPsicologo: number, idPaciente: number, idResponsavel: number) {
        const vinculo = await this.prisma.vinculoPacienteResponsavel.findFirst({
            where: {
                id_paciente: idPaciente,
                id_responsavel: idResponsavel,
                paciente: { id_psicologo: idPsicologo },
            },
        })

        if (!vinculo) {
            throw new NotFoundException('Vínculo com o responsável não encontrado.')
        }

        await this.prisma.vinculoPacienteResponsavel.delete({
            where: { id_vinculo: vinculo.id_vinculo },
        })

        return { message: 'Responsável desvinculado com sucesso.' }
    }

    async excluirPaciente(idPsicologo: number, idPaciente: number, dto: ExcluirPacienteDto) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id_usuario: idPsicologo },
        })

        if (!usuario || !(await bcrypt.compare(dto.senha, usuario.senha))) {
            throw new UnauthorizedException('Senha de confirmação incorreta.')
        }

        const paciente = await this.prisma.paciente.findFirst({
            where: {
                id_paciente: idPaciente,
                id_psicologo: idPsicologo,
            },
        })

        if (!paciente) {
            throw new NotFoundException('Paciente não encontrado.')
        }

        if (paciente.status !== StatusPaciente.ARQUIVADO) {
            throw new BadRequestException('Não é possível excluir um paciente com cadastro ativo. Arquive o paciente antes de excluí-lo permanentemente.')
        }

        return this.prisma.paciente.delete({
            where: { id_paciente: idPaciente },
        })
    }
}