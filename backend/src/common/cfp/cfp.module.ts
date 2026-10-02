import { Module } from '@nestjs/common'
import { CfpService } from './cfp.service'

@Module({
    providers: [CfpService],
    exports: [CfpService],
})
export class CfpModule {}