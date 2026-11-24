import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TSessionPortal } from '../../auth/enums/sessionPortal.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class LoginAttemptService {
  private readonly maxAttempts: number;
  private readonly lockoutMinutes: number;
  private readonly adminLockoutMinutes: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.maxAttempts = this.configService.get<number>(
      'throttle.lockoutMaxAttempts',
      5,
    );
    this.lockoutMinutes = this.configService.get<number>(
      'throttle.lockoutMinutes',
      15,
    );
    this.adminLockoutMinutes = this.configService.get<number>(
      'throttle.adminLockoutMinutes',
      30,
    );
  }

  async assertNotLocked(user: User, portal: TSessionPortal): Promise<void> {
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_LOGIN_LOCKED,
        result: AuditResult.FAILURE,
        actorUserId: user.id,
        workspaceId: user.workspaceId,
        targetType: 'user',
        targetId: user.id,
        metadata: { portal },
      });

      throw new UnauthorizedException({
        message: 'Invalid email or password.',
        code: ERROR_CODES.INVALID_CREDENTIALS,
      });
    }
  }

  async recordFailure(user: User, portal: TSessionPortal): Promise<void> {
    const nextAttempts = (user.failedLoginAttempts || 0) + 1;
    let lockedUntil: Date | null = null;

    if (nextAttempts >= this.maxAttempts) {
      const minutes =
        portal === 'admin' ? this.adminLockoutMinutes : this.lockoutMinutes;
      lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        failedLoginAttempts: () => 'failed_login_attempts + 1',
        ...(lockedUntil ? { lockedUntil } : {}),
      })
      .where('id = :id', { id: user.id })
      .execute();

    if (lockedUntil) {
      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_LOGIN_LOCKED,
        result: AuditResult.FAILURE,
        actorUserId: user.id,
        workspaceId: user.workspaceId,
        targetType: 'user',
        targetId: user.id,
        metadata: { portal, attempts: nextAttempts, lockedUntil },
      });
    }
  }

  async recordSuccess(user: User): Promise<void> {
    await this.userRepository.update(
      { id: user.id },
      {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    );
  }

  async resetAttempts(emailOrUserId: string): Promise<void> {
    await this.userRepository.update(
      [{ email: emailOrUserId }, { id: emailOrUserId }],
      {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    );
  }
}
