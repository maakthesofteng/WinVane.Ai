import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Response } from 'express';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { PasswordService } from '../../auth-core/services/password.service';
import { LoginAttemptService } from '../../auth-core/services/loginAttempt.service';
import { MfaChallengeService } from '../../auth-core/services/mfaChallenge.service';
import { SessionCookieService } from '../../auth-core/services/sessionCookie.service';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { ROLE_NAMES } from '../../rbac/constants';
import { AdminLoginDto } from '../dto/adminLogin.dto';
import { AdminLoginChallengeResponseDto } from '../dto/adminAuthResponse.dto';

@Injectable()
export class AdminLoginService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly mfaChallengeService: MfaChallengeService,
    private readonly sessionCookieService: SessionCookieService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(
    dto: AdminLoginDto,
    ip: string,
    ua: string | undefined,
    res: Response,
  ): Promise<AdminLoginChallengeResponseDto> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: normalizedEmail })
      .getOne();

    // Reject unknown users or non-platform / non-SuperAdmin roles immediately
    if (
      !user ||
      !user.role ||
      !user.role.isPlatformRole ||
      user.role.name !== ROLE_NAMES.SUPER_ADMIN ||
      !user.passwordHash
    ) {
      await this.passwordService.verifyDummy(dto.password);
      return this.failLogin(user?.id, 'unknown_or_wrong_portal', ip, ua);
    }

    // 30-minute lockout for SuperAdmin portal
    await this.loginAttemptService.assertNotLocked(user, 'admin');

    const isPasswordValid = await this.passwordService.verify(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      await this.loginAttemptService.recordFailure(user, 'admin');
      return this.failLogin(user.id, 'wrong_password', ip, ua);
    }

    // Don't leak account status if inactive/suspended
    if (user.status !== UserStatus.ACTIVE) {
      return this.failLogin(user.id, 'inactive_account', ip, ua);
    }

    await this.loginAttemptService.recordSuccess(user);

    if (this.passwordService.needsRehash(user.passwordHash)) {
      const newHash = await this.passwordService.hash(dto.password);
      await this.dataSource
        .getRepository(User)
        .update(user.id, { passwordHash: newHash });
    }

    // Mandatory 2FA: NEVER create a session on the login step.
    const challengeType: 'setup' | 'verify' = user.mfaEnabled
      ? 'verify'
      : 'setup';

    const challengeId = await this.mfaChallengeService.create({
      userId: user.id,
      portal: 'admin',
      type: challengeType,
      ipAddress: ip,
      userAgent: ua,
    });

    this.sessionCookieService.setMfaChallenge(res, challengeId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ADMIN_LOGIN_SUCCESS,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      targetType: 'user',
      targetId: user.id,
      ipAddress: ip,
      userAgent: ua,
      metadata: { stage: 'password', type: challengeType },
    });

    return {
      status: challengeType === 'setup' ? 'mfa_setup_required' : 'mfa_required',
    };
  }

  private async failLogin(
    userId: string | undefined,
    reason: string,
    ip: string,
    ua: string | undefined,
  ): Promise<never> {
    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ADMIN_LOGIN_FAILURE,
      result: AuditResult.FAILURE,
      actorUserId: userId ?? null,
      targetType: 'user',
      targetId: userId ?? undefined,
      ipAddress: ip,
      userAgent: ua,
      metadata: { reason },
    });

    throw new UnauthorizedException({
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: 'Invalid email or password.',
    });
  }
}
