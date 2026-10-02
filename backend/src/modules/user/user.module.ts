import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_TOKEN,
      signOptions: { expiresIn: '6h' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
