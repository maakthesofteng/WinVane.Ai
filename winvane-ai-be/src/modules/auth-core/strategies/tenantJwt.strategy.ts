import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { SessionService } from '../services/session.service';
import { AuthContextService } from '../services/authContext.service';
import { AUTH_STRATEGY_NAMES } from '../constants/auth.constants';
import { IAuthContext, IJwtPayload } from '../interfaces/authContext.interface';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class TenantJwtStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY_NAMES.TENANT,
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly authContextService: AuthContextService,
  ) {
    const cookieName = configService.get<string>(
      'cookie.sessionCookieName',
      'wv_session',
    );

    super({
      jwtFromRequest: (req: Request): string | null => {
        if (req && req.cookies) {
          const cookies = req.cookies as Record<string, unknown>;
          const val = cookies[cookieName];
          return typeof val === 'string' ? val : null;
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret', 'default_secret'),
    });
  }

  async validate(payload: IJwtPayload): Promise<IAuthContext> {
    if (!payload || payload.portal !== 'tenant') {
      throw new UnauthorizedException({
        message: 'Invalid tenant session credentials.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    const session = await this.sessionService.validate(payload);
    if (!session) {
      throw new UnauthorizedException({
        message: 'Session is invalid or has expired.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    const user = await this.authContextService.load(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        message: 'User account not found.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    if (user.status !== 'active') {
      const code =
        user.status === 'inactive'
          ? ERROR_CODES.ACCOUNT_INACTIVE
          : ERROR_CODES.ACCOUNT_SUSPENDED;
      const message =
        user.status === 'inactive'
          ? 'Your account has been deactivated. Contact your workspace admin.'
          : 'User account is not active.';

      throw new UnauthorizedException({
        message,
        code,
      });
    }

    if (user.workspaceStatus && user.workspaceStatus !== 'active') {
      throw new UnauthorizedException({
        message: 'Workspace is currently suspended.',
        code: ERROR_CODES.WORKSPACE_SUSPENDED,
      });
    }

    if (user.isPlatformRole) {
      throw new UnauthorizedException({
        message: 'Platform administrators cannot access tenant portal.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    await this.sessionService.touch(payload.sid);

    return {
      userId: user.userId,
      sessionId: payload.sid,
      portal: 'tenant',
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      roleSystemKey: user.roleSystemKey,
      isCustomRole: user.isCustomRole,
      isPlatformRole: false,
      workspaceId: user.workspaceId,
      permissions: user.permissions,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
