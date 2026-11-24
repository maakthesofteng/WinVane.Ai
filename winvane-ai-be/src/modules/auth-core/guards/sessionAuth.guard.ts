import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  AUTH_METADATA_KEYS,
  AUTH_STRATEGY_NAMES,
} from '../constants/auth.constants';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  private readonly tenantGuard = new (AuthGuard(AUTH_STRATEGY_NAMES.TENANT))();
  private readonly adminGuard = new (AuthGuard(AUTH_STRATEGY_NAMES.ADMIN))();

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      AUTH_METADATA_KEYS.IS_PUBLIC,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const isAdminPortal = this.reflector.getAllAndOverride<boolean>(
      AUTH_METADATA_KEYS.IS_ADMIN_PORTAL,
      [context.getHandler(), context.getClass()],
    );

    const guard = isAdminPortal ? this.adminGuard : this.tenantGuard;

    try {
      const result = await (guard.canActivate(context) as Promise<boolean>);
      if (!result) {
        throw new UnauthorizedException({
          message: 'Authentication required.',
          code: ERROR_CODES.UNAUTHENTICATED,
        });
      }

      const request = context.switchToHttp().getRequest<{ user?: unknown }>();
      if (!request?.user) {
        throw new UnauthorizedException({
          message: 'Authentication required.',
          code: ERROR_CODES.UNAUTHENTICATED,
        });
      }

      return true;
    } catch (err) {
      const request = context
        .switchToHttp()
        .getRequest<{ url?: string; originalUrl?: string }>();
      const isLogoutRoute = Boolean(
        request?.url?.includes('/logout') ||
        request?.originalUrl?.includes('/logout'),
      );
      if (isLogoutRoute) {
        return true;
      }

      if (err instanceof UnauthorizedException) {
        const response = err.getResponse();
        if (
          typeof response === 'object' &&
          response !== null &&
          (response as Record<string, unknown>).code
        ) {
          throw err;
        }
      }

      throw new UnauthorizedException({
        message: 'Authentication required.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }
  }
}
