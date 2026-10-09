import { Module } from '@nestjs/common'
import { CfpService } from './crp.service'

@Module({
    providers: [CfpService],
    exports: [CfpService],
})
export class CfpModule { }