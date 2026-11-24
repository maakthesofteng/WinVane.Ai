import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordService } from '../../auth-core/services/password.service';
import { RedisService } from '../../redis/redis.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { User } from '../../users/entities/user.entity';

const STEP_UP_FAIL_PREFIX = 'auth:step_up_fail:';
const MAX_STEP_UP_FAILS_PER_HOUR = 10;
const STEP_UP_WINDOW_SECONDS = 3600;

@Injectable()
export class StepUpService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly redisService: RedisService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async assertCurrentPassword(
    user: User,
    currentPassword: string,
  ): Promise<void> {
    const key = `${STEP_UP_FAIL_PREFIX}${user.id}`;
    const rawCount = await this.redisService.get(key);
    const count = rawCount ? parseInt(rawCount, 10) : 0;

    if (count >= MAX_STEP_UP_FAILS_PER_HOUR) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many failed step-up attempts. Please try again later.',
          code: 'TOO_MANY_REQUESTS',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect.',
        code: ERROR_CODES.INVALID_CURRENT_PASSWORD,
      });
    }

    const isValid = await this.passwordService.verify(
      user.passwordHash,
      currentPassword,
    );

    if (!isValid) {
      const newCount = count + 1;
      await this.redisService.set(
        key,
        String(newCount),
        STEP_UP_WINDOW_SECONDS,
      );

      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
        result: AuditResult.FAILURE,
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        metadata: {
          reason: 'invalid_current_password',
          stepUpFailCount: newCount,
        },
      });

      if (newCount >= MAX_STEP_UP_FAILS_PER_HOUR) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'Too many failed step-up attempts. Please try again later.',
            code: 'TOO_MANY_REQUESTS',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException({
        message: 'Current password is incorrect.',
        code: ERROR_CODES.INVALID_CURRENT_PASSWORD,
      });
    }

    // Success -> clear step-up failure tracker
    if (count > 0) {
      await this.redisService.del(key);
    }
  }
}
