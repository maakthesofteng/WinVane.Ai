import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Session } from '../../auth/entities/session.entity';
import { SessionPortal } from '../../auth/enums/sessionPortal.enum';
import { SessionRevokedReason } from '../../auth/enums/sessionRevokedReason.enum';
import { SessionService } from '../../auth-core/services/session.service';
import { parseUserAgent } from '../../../common/utils/userAgent.util';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { ISessionView, RevokeOthersResponseDto } from '../dto';

@Injectable()
export class SessionSettingsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly sessionService: SessionService,
  ) {}

  async list(auth: IAuthContext): Promise<ISessionView[]> {
    const sessions = await this.sessionService.listActive(
      auth.userId,
      auth.portal,
    );

    return sessions.map((s) => {
      const parsedUa = parseUserAgent(s.userAgent);
      return {
        id: s.id,
        current: s.id === auth.sessionId,
        ipAddress: s.ipAddress,
        browser: parsedUa.browser,
        os: parsedUa.os,
        deviceType: parsedUa.deviceType,
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      };
    });
  }

  async revoke(auth: IAuthContext, sessionId: string): Promise<void> {
    if (sessionId === auth.sessionId) {
      throw new BadRequestException({
        message: 'Cannot revoke current session. Use logout instead.',
        code: ERROR_CODES.USE_LOGOUT,
      });
    }

    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        userId: auth.userId,
        portal: auth.portal as SessionPortal,
        revokedAt: IsNull(),
      },
    });

    if (!session) {
      throw new NotFoundException({
        message: 'Session not found.',
        code: ERROR_CODES.SESSION_NOT_FOUND,
      });
    }

    await this.sessionService.revoke(
      session.id,
      SessionRevokedReason.REVOKED_BY_USER,
      auth.userId,
    );
  }

  async revokeOthers(auth: IAuthContext): Promise<RevokeOthersResponseDto> {
    const activeSessions = await this.sessionService.listActive(
      auth.userId,
      auth.portal,
    );
    const others = activeSessions.filter((s) => s.id !== auth.sessionId);

    if (others.length > 0) {
      await this.sessionService.revokeAllForUser(
        auth.userId,
        SessionRevokedReason.REVOKED_BY_USER,
        {
          exceptSessionId: auth.sessionId,
          portal: auth.portal,
        },
      );
    }

    return { revokedCount: others.length };
  }
}
