import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IsNull, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Session } from '../../auth/entities/session.entity';
import {
  SessionPortal,
  TSessionPortal,
} from '../../auth/enums/sessionPortal.enum';
import {
  SessionRevokedReason,
  TSessionRevokedReason,
} from '../../auth/enums/sessionRevokedReason.enum';
import { RedisService } from '../../redis/redis.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { TokenService } from './token.service';
import { AUTH_CACHE_KEYS } from '../constants/auth.constants';
import {
  IJwtPayload,
  ISessionRecord,
} from '../interfaces/authContext.interface';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly tenantTtlHours: number;
  private readonly adminTtlHours: number;
  private readonly adminIdleMinutes: number;
  private readonly cacheTtlSeconds: number;

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.tenantTtlHours = this.configService.get<number>(
      'jwt.sessionTtlHours',
      24,
    );
    this.adminTtlHours = this.configService.get<number>(
      'jwt.adminSessionTtlHours',
      8,
    );
    this.adminIdleMinutes = this.configService.get<number>(
      'jwt.adminSessionIdleMinutes',
      30,
    );
    this.cacheTtlSeconds = this.configService.get<number>(
      'jwt.sessionCacheTtlSeconds',
      300,
    );
  }

  async create(params: {
    userId: string;
    portal: TSessionPortal;
    ipAddress: string;
    userAgent: string;
  }): Promise<{ session: Session; jwt: string; expiresAt: Date }> {
    const ttlHours =
      params.portal === 'admin' ? this.adminTtlHours : this.tenantTtlHours;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);
    const jti = randomUUID();
    const jtiHash = this.tokenService.hash(jti);
    const now = new Date();

    const session = this.sessionRepository.create({
      userId: params.userId,
      portal: params.portal as SessionPortal,
      jtiHash,
      ipAddress: params.ipAddress.slice(0, 45),
      userAgent: params.userAgent.slice(0, 512),
      createdAt: now,
      lastSeenAt: now,
      expiresAt,
    });

    const savedSession = await this.sessionRepository.save(session);

    const payload: IJwtPayload = {
      sub: params.userId,
      sid: savedSession.id,
      portal: params.portal,
      jti,
    };

    const jwt = this.jwtService.sign(payload, {
      expiresIn: `${ttlHours}h`,
    });

    await this.cacheSession({
      id: savedSession.id,
      userId: savedSession.userId,
      portal: params.portal,
      jtiHash: savedSession.jtiHash,
      expiresAt: savedSession.expiresAt.toISOString(),
      lastSeenAt: savedSession.lastSeenAt.toISOString(),
      revoked: false,
    });

    return { session: savedSession, jwt, expiresAt };
  }

  async validate(payload: IJwtPayload): Promise<ISessionRecord | null> {
    if (!payload?.sid || !payload?.sub || !payload?.jti) {
      return null;
    }

    const cacheKey = `${AUTH_CACHE_KEYS.SESSION_PREFIX}${payload.sid}`;
    const cached = await this.redisService.get<ISessionRecord | string>(
      cacheKey,
    );

    let record: ISessionRecord | null = null;
    if (cached) {
      if (typeof cached === 'object' && cached !== null) {
        record = cached;
      } else {
        try {
          record = JSON.parse(cached) as ISessionRecord;
        } catch {
          record = null;
        }
      }
    }

    if (!record) {
      const dbSession = await this.sessionRepository.findOne({
        where: { id: payload.sid },
      });
      if (
        !dbSession ||
        dbSession.revokedAt ||
        new Date(dbSession.expiresAt) <= new Date()
      ) {
        return null;
      }

      record = {
        id: dbSession.id,
        userId: dbSession.userId,
        portal: dbSession.portal as TSessionPortal,
        jtiHash: dbSession.jtiHash,
        expiresAt: dbSession.expiresAt.toISOString(),
        lastSeenAt: dbSession.lastSeenAt.toISOString(),
        revoked: false,
      };

      await this.cacheSession(record);
    }

    if (record.revoked || new Date(record.expiresAt) <= new Date()) {
      return null;
    }

    if (record.portal !== payload.portal) {
      return null;
    }

    const payloadJtiHash = this.tokenService.hash(payload.jti);
    if (!this.tokenService.safeEqual(record.jtiHash, payloadJtiHash)) {
      return null;
    }

    if (record.portal === 'admin') {
      const lastSeen = new Date(record.lastSeenAt).getTime();
      const idleMs = Date.now() - lastSeen;
      if (idleMs > this.adminIdleMinutes * 60 * 1000) {
        await this.revoke(record.id, SessionRevokedReason.IDLE_TIMEOUT);
        return null;
      }
    }

    return record;
  }

  async touch(sid: string): Promise<void> {
    const throttleKey = `${AUTH_CACHE_KEYS.SESSION_TOUCH_PREFIX}${sid}`;
    const exists = await this.redisService.get(throttleKey);
    if (exists) {
      return;
    }

    await this.redisService.set(throttleKey, '1', 60);
    const now = new Date();
    await this.sessionRepository.update({ id: sid }, { lastSeenAt: now });

    const cacheKey = `${AUTH_CACHE_KEYS.SESSION_PREFIX}${sid}`;
    const cached = await this.redisService.get<ISessionRecord | string>(
      cacheKey,
    );
    if (cached) {
      try {
        const record =
          typeof cached === 'object' && cached !== null
            ? { ...cached }
            : (JSON.parse(cached) as ISessionRecord);
        record.lastSeenAt = now.toISOString();
        await this.cacheSession(record);
      } catch {
        // ignore cache serialization error
      }
    }
  }

  async revoke(
    sid: string,
    reason: TSessionRevokedReason,
    actorUserId?: string | null,
  ): Promise<void> {
    const now = new Date();
    await this.sessionRepository.update(
      { id: sid },
      {
        revokedAt: now,
        revokedReason: reason as SessionRevokedReason,
      },
    );

    const cacheKey = `${AUTH_CACHE_KEYS.SESSION_PREFIX}${sid}`;
    await this.redisService.del(cacheKey);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.SESSION_REVOKED,
      result: AuditResult.SUCCESS,
      actorUserId: actorUserId ?? null,
      targetType: 'session',
      targetId: sid,
      metadata: { reason },
    });
  }

  async revokeAllForUser(
    userId: string,
    reason: TSessionRevokedReason,
    options?: { exceptSessionId?: string; portal?: TSessionPortal },
  ): Promise<void> {
    const where: Record<string, unknown> = {
      userId,
      revokedAt: IsNull(),
    };

    if (options?.portal) {
      where.portal = options.portal;
    }
    if (options?.exceptSessionId) {
      where.id = Not(options.exceptSessionId);
    }

    const sessions = await this.sessionRepository.find({ where });
    if (sessions.length === 0) {
      return;
    }

    const now = new Date();
    for (const s of sessions) {
      s.revokedAt = now;
      s.revokedReason = reason as SessionRevokedReason;
      await this.redisService.del(`${AUTH_CACHE_KEYS.SESSION_PREFIX}${s.id}`);
    }

    await this.sessionRepository.save(sessions);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.SESSION_REVOKED_ALL,
      result: AuditResult.SUCCESS,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      metadata: { reason, count: sessions.length },
    });
  }

  async listActive(
    userId: string,
    portal?: TSessionPortal,
  ): Promise<Session[]> {
    const where: Record<string, unknown> = {
      userId,
      revokedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    };
    if (portal) {
      where.portal = portal;
    }

    return this.sessionRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  private async cacheSession(record: ISessionRecord): Promise<void> {
    const remainingSeconds = Math.max(
      1,
      Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000),
    );
    const ttl = Math.min(this.cacheTtlSeconds, remainingSeconds);
    const key = `${AUTH_CACHE_KEYS.SESSION_PREFIX}${record.id}`;
    await this.redisService.set(key, JSON.stringify(record), ttl);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const result = await this.sessionRepository.delete({
      expiresAt: LessThan(cutoff),
    });
    this.logger.log(
      `Cleaned up ${result.affected ?? 0} expired sessions older than 30 days.`,
    );
  }
}
