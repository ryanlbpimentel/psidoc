import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator'

// RF01: nome, e-mail, senha, CPF e número do CRP. Telefone é exigido pela coluna já existente
// de Usuario (não opcional no banco), por isso entra aqui também.
export class RegistrarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string

  @IsEmail()
  email: string

  @IsString()
  @Length(11, 11, { message: 'cpf deve ter 11 dígitos' })
  cpf: string

  @IsString()
  @IsNotEmpty()
  telefone: string

  @IsString()
  @MinLength(8)
  senha: string

  @IsString()
  @IsNotEmpty()
  crp: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @IsNotEmpty()
  senha: string
}

export class SolicitarRecuperacaoSenhaDto {
  @IsEmail()
  email: string
}

export class RedefinirSenhaDto {
  @IsString()
  @IsNotEmpty()
  token: string

  @IsString()
  @MinLength(8)
  novaSenha: string
}
