import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthContext } from '../interfaces/authContext.interface';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IAuthContext => {
    const request = ctx.switchToHttp().getRequest<{ user: IAuthContext }>();
    return request.user;
  },
);
