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
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  AUTH_STRATEGY_NAMES.ADMIN,
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly authContextService: AuthContextService,
  ) {
    const cookieName = configService.get<string>(
      'cookie.adminSessionCookieName',
      'wv_admin_session',
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
    if (!payload || payload.portal !== 'admin') {
      throw new UnauthorizedException({
        message: 'Invalid administrative session credentials.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    const session = await this.sessionService.validate(payload);
    if (!session) {
      throw new UnauthorizedException({
        message: 'Administrative session is invalid or has expired.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    const user = await this.authContextService.load(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Admin account not found.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException({
        message: 'Admin account is not active.',
        code: ERROR_CODES.ACCOUNT_SUSPENDED,
      });
    }

    if (!user.isPlatformRole) {
      throw new UnauthorizedException({
        message: 'Non-platform users cannot access administrator portal.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    await this.sessionService.touch(payload.sid);

    return {
      userId: user.userId,
      sessionId: payload.sid,
      portal: 'admin',
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      roleSystemKey: user.roleSystemKey,
      isCustomRole: user.isCustomRole,
      isPlatformRole: true,
      workspaceId: null,
      permissions: user.permissions,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
