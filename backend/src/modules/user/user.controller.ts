import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { UserService } from './user.service'
import {
  LoginDto,
  RedefinirSenhaDto,
  RegistrarUsuarioDto,
  SolicitarRecuperacaoSenhaDto,
} from './dto/user.dto'

@Controller('usuarios')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('registrar')
  registrar(@Body() dto: RegistrarUsuarioDto) {
    return this.userService.registrar(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.userService.login(dto)
  }

  @Post('esqueci-senha')
  @HttpCode(HttpStatus.ACCEPTED)
  async esqueciSenha(@Body() dto: SolicitarRecuperacaoSenhaDto): Promise<{ message: string }> {
    await this.userService.solicitarRecuperacaoSenha(dto.email)
    return { message: 'Se o e-mail informado estiver cadastrado, enviaremos um código.' }
  }

  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  async redefinirSenha(@Body() dto: RedefinirSenhaDto): Promise<{ message: string }> {
    await this.userService.redefinirSenha(dto.token, dto.novaSenha)
    return { message: 'Senha redefinida com sucesso.' }
  }
}
