import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [
    JwtModule.register({
      // Troque JWT_SECRET no .env em qualquer ambiente real — este é só um valor de desenvolvimento.
      secret: process.env.JWT_SECRET ?? 'dev-secret-troque-em-producao',
      signOptions: { expiresIn: '6h' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
