import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { TokenService } from './token.service';
import { LoginAttemptService } from './loginAttempt.service';
import { User } from '../../users/entities/user.entity';
import { TSessionPortal } from '../../auth/enums/sessionPortal.enum';
import { AUTH_CACHE_KEYS } from '../constants/auth.constants';
import { IMfaChallengeRecord } from '../interfaces/authContext.interface';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class MfaChallengeService {
  private readonly logger = new Logger(MfaChallengeService.name);
  private readonly ttlSeconds: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {
    this.ttlSeconds = this.configService.get<number>(
      'cookie.mfaChallengeTtlSeconds',
      300,
    );
    this.maxAttempts = this.configService.get<number>(
      'mfa.challengeMaxAttempts',
      5,
    );
  }

  async create(params: {
    userId: string;
    portal: TSessionPortal;
    type: 'verify' | 'setup';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    const challengeId = randomUUID();
    const uaHash = this.tokenService.hash(params.userAgent || '');

    const record: IMfaChallengeRecord = {
      id: challengeId,
      userId: params.userId,
      portal: params.portal,
      type: params.type,
      uaHash,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    const key = `${AUTH_CACHE_KEYS.MFA_CHALLENGE_PREFIX}${challengeId}`;
    await this.redisService.set(key, JSON.stringify(record), this.ttlSeconds);

    return challengeId;
  }

  async get(
    challengeId: string,
    expectedPortal: TSessionPortal,
    expectedType: 'verify' | 'setup',
    currentUserAgent?: string,
  ): Promise<IMfaChallengeRecord> {
    if (!challengeId) {
      this.logger.warn('MFA challenge get failed: challengeId is missing.');
      throw new UnauthorizedException({
        message: 'MFA challenge is missing or invalid.',
        code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
      });
    }

    const key = `${AUTH_CACHE_KEYS.MFA_CHALLENGE_PREFIX}${challengeId}`;
    const raw = await this.redisService.get<IMfaChallengeRecord | string>(key);

    if (!raw) {
      this.logger.warn(`MFA challenge expired or not found for key: ${key}`);
      throw new UnauthorizedException({
        message: 'MFA challenge has expired. Please authenticate again.',
        code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
      });
    }

    let record: IMfaChallengeRecord;
    if (typeof raw === 'object' && raw !== null) {
      record = raw;
    } else {
      try {
        record = JSON.parse(raw) as IMfaChallengeRecord;
      } catch (err) {
        this.logger.warn(
          `Failed to parse MFA challenge record for key ${key}: ${String(err)}`,
        );
        throw new UnauthorizedException({
          message: 'MFA challenge is invalid.',
          code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
        });
      }
    }

    if (record.portal !== expectedPortal || record.type !== expectedType) {
      this.logger.warn(
        `MFA challenge portal/type mismatch for key ${key}. Expected ${expectedPortal}/${expectedType}, got ${record.portal}/${record.type}`,
      );
      throw new UnauthorizedException({
        message: 'MFA challenge is not valid for this portal or action.',
        code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
      });
    }

    if (record.uaHash && currentUserAgent) {
      const emptyUaHash = this.tokenService.hash('');
      if (record.uaHash !== emptyUaHash) {
        const currentUaHash = this.tokenService.hash(currentUserAgent);
        if (!this.tokenService.safeEqual(record.uaHash, currentUaHash)) {
          this.logger.warn(
            `MFA challenge user-agent mismatch for challenge ${challengeId}. Recorded UA hash: ${record.uaHash}, Current UA: "${currentUserAgent}"`,
          );
          await this.consume(challengeId);
          throw new UnauthorizedException({
            message: 'MFA challenge user-agent mismatch.',
            code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
          });
        }
      }
    }

    return record;
  }

  async registerFailure(
    challengeId: string,
    user: User,
    portal: TSessionPortal,
  ): Promise<void> {
    const key = `${AUTH_CACHE_KEYS.MFA_CHALLENGE_PREFIX}${challengeId}`;
    const raw = await this.redisService.get<IMfaChallengeRecord | string>(key);
    if (!raw) {
      return;
    }

    try {
      const record =
        typeof raw === 'object' && raw !== null
          ? raw
          : (JSON.parse(raw) as IMfaChallengeRecord);
      record.attempts = (record.attempts || 0) + 1;

      if (record.attempts >= this.maxAttempts) {
        await this.consume(challengeId);
        await this.loginAttemptService.recordFailure(user, portal);
      } else {
        await this.redisService.set(
          key,
          JSON.stringify(record),
          this.ttlSeconds,
        );
      }
    } catch {
      // ignore parse errors
    }
  }

  async consume(challengeId: string): Promise<void> {
    const key = `${AUTH_CACHE_KEYS.MFA_CHALLENGE_PREFIX}${challengeId}`;
    await this.redisService.del(key);
  }
}
