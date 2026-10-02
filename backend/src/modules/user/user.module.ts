import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { JwtAuthGuard } from '@common/jwt/jwt.guard'

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '6h' },
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    JwtAuthGuard,
  ],
  exports: [
    UserService,
    JwtAuthGuard,
  ],
})
export class UserModule { }