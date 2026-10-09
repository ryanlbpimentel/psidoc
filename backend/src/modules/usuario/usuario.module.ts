import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UserController } from './usuario.controller'
import { UserService } from './usuario.service'
import { JwtAuthGuard } from '@common/auth/auth.guard'
import { CfpModule } from '@common/crpApi/crp.module'

@Module({
    imports: [
        JwtModule.register({ global: true, secret: process.env.JWT_SECRET, signOptions: { expiresIn: '6h' } }),
        CfpModule,
    ],
    controllers: [UserController],
    providers: [UserService, JwtAuthGuard],
    exports: [UserService, JwtAuthGuard],
})
export class UserModule { }