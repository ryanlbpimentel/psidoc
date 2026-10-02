import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserService } from './user.service'
import { LoginDto } from './dto/login.dto'
import { RegistrarDto } from './dto/registrar.dto'
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto'
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto'

@ApiTags('Usuários')
@Controller('usuarios')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('registrar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um novo psicólogo e retorna o token de acesso' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Psicólogo cadastrado com sucesso. Retorna o token JWT.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'E-mail, CPF ou CRP já cadastrado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de validação inválidos.',
  })
  registrar(@Body() dto: RegistrarDto) {
    return this.userService.registrar(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um usuário existente pelo e-mail e senha' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login efetuado com sucesso. Retorna o token JWT.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'E-mail ou senha inválidos.',
  })
  login(@Body() dto: LoginDto) {
    return this.userService.login(dto)
  }

  @Post('esqueci-senha')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicita código/link de redefinição de senha via e-mail' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Solicitação aceita. Se o e-mail existir, o código é enviado.',
    schema: {
      example: {
        message: 'Se o e-mail informado estiver cadastrado, enviaremos um código.',
      },
    },
  })
  async esqueciSenha(@Body() dto: EsqueciSenhaDto): Promise<{ message: string }> {
    await this.userService.esqueciSenha(dto)
    return { message: 'Se o e-mail informado estiver cadastrado, enviaremos um código.' }
  }

  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefine a senha do usuário utilizando o token de recuperação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha redefinida com sucesso.',
    schema: {
      example: {
        message: 'Senha redefinida com sucesso.',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Código/token inválido ou expirado.',
  })
  async redefinirSenha(@Body() dto: RedefinirSenhaDto): Promise<{ message: string }> {
    await this.userService.redefinirSenha(dto)
    return { message: 'Senha redefinida com sucesso.' }
  }
}
