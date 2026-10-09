import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
    (propriedade: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest()
        const user = request.user

        return propriedade ? user?.[propriedade] : user
    },
)