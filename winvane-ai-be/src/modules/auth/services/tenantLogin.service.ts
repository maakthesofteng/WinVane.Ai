import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Response } from 'express';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { PasswordService } from '../../auth-core/services/password.service';
import { LoginAttemptService } from '../../auth-core/services/loginAttempt.service';
import { SessionService } from '../../auth-core/services/session.service';
import { SessionCookieService } from '../../auth-core/services/sessionCookie.service';
import { MfaService } from '../../auth-core/services/mfa.service';
import { MfaChallengeService } from '../../auth-core/services/mfaChallenge.service';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { SessionRevokedReason } from '../enums/sessionRevokedReason.enum';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { LoginDto } from '../dto/login.dto';
import { MfaVerifyDto } from '../dto/mfaVerify.dto';
import {
  IAuthMeResponse,
  TAuthLoginResponse,
} from '../interfaces/authResponse.interface';
import {
  fetchRolePermissions,
  mapUserToAuthUserDto,
  mapWorkspaceToSummaryDto,
} from '../utils/authDto.mapper';
import { assertUserAndWorkspaceActive } from '../utils/authStatus.validator';

@Injectable()
export class TenantLoginService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly sessionService: SessionService,
    private readonly sessionCookieService: SessionCookieService,
    private readonly mfaService: MfaService,
    private readonly mfaChallengeService: MfaChallengeService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(
    dto: LoginDto,
    ip: string,
    ua: string | undefined,
    res: Response,
  ): Promise<TAuthLoginResponse> {
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.workspace', 'workspace')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (
      !user ||
      !user.role ||
      !user.workspace ||
      user.role.isPlatformRole ||
      user.status === UserStatus.INVITED ||
      !user.passwordHash
    ) {
      await this.passwordService.verifyDummy(dto.password);
      return this.failLogin(null, 'unknown_or_wrong_portal', ip, ua);
    }

    await this.loginAttemptService.assertNotLocked(user, 'tenant');
    const valid = await this.passwordService.verify(
      user.passwordHash,
      dto.password,
    );

    if (!valid) {
      await this.loginAttemptService.recordFailure(user, 'tenant');
      return this.failLogin(user, 'wrong_password', ip, ua);
    }

    assertUserAndWorkspaceActive(user);
    await this.loginAttemptService.recordSuccess(user);

    if (this.passwordService.needsRehash(user.passwordHash)) {
      const newHash = await this.passwordService.hash(dto.password);
      await this.dataSource
        .getRepository(User)
        .update(user.id, { passwordHash: newHash });
    }

    if (user.mfaEnabled) {
      const challengeId = await this.mfaChallengeService.create({
        userId: user.id,
        portal: 'tenant',
        type: 'verify',
        userAgent: ua,
      });
      this.sessionCookieService.setMfaChallenge(res, challengeId);
      return { status: 'mfa_required' };
    }

    const { jwt, expiresAt } = await this.sessionService.create({
      userId: user.id,
      portal: 'tenant',
      ipAddress: ip,
      userAgent: ua || 'unknown',
    });

    this.sessionCookieService.set(res, 'tenant', jwt, expiresAt);
    const perms = await fetchRolePermissions(this.dataSource, user.roleId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      workspaceId: user.workspaceId ?? undefined,
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      status: 'authenticated',
      user: mapUserToAuthUserDto(user, perms),
      workspace: mapWorkspaceToSummaryDto(user.workspace),
    };
  }

  async verifyMfa(
    dto: MfaVerifyDto,
    chCookie: string | undefined,
    ip: string,
    ua: string | undefined,
    res: Response,
  ): Promise<TAuthLoginResponse> {
    if (!chCookie) {
      throw new UnauthorizedException({
        code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
        message: 'MFA challenge expired. Please login again.',
      });
    }

    const ch = await this.mfaChallengeService.get(
      chCookie,
      'tenant',
      'verify',
      ua,
    );
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: ch.userId },
      relations: { role: true, workspace: true },
    });

    if (!user || !user.workspace) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'User not found.',
      });
    }

    let verifyResult: {
      method: 'totp' | 'backup_code';
      backupCodesRemaining?: number;
    };
    try {
      verifyResult = await this.mfaService.verify(ch.userId, dto.code);
    } catch (err) {
      await this.mfaChallengeService.registerFailure(chCookie, user, 'tenant');
      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_MFA_CHALLENGE_FAILURE,
        result: AuditResult.FAILURE,
        actorUserId: ch.userId,
        ipAddress: ip,
        userAgent: ua,
      });
      throw err;
    }

    await this.mfaChallengeService.consume(chCookie);
    this.sessionCookieService.clearMfaChallenge(res);

    const { jwt, expiresAt } = await this.sessionService.create({
      userId: user.id,
      portal: 'tenant',
      ipAddress: ip,
      userAgent: ua || 'unknown',
    });

    this.sessionCookieService.set(res, 'tenant', jwt, expiresAt);
    const perms = await fetchRolePermissions(this.dataSource, user.roleId);

    const meta = { mfaMethod: verifyResult.method };
    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_MFA_CHALLENGE_SUCCESS,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      workspaceId: user.workspaceId ?? undefined,
      metadata: meta,
      ipAddress: ip,
      userAgent: ua,
    });
    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      workspaceId: user.workspaceId ?? undefined,
      metadata: meta,
      ipAddress: ip,
      userAgent: ua,
    });

    const isBackup = verifyResult.method === 'backup_code';
    return {
      status: 'authenticated',
      user: mapUserToAuthUserDto(user, perms),
      workspace: mapWorkspaceToSummaryDto(user.workspace),
      ...(isBackup
        ? {
            warning: 'BACKUP_CODE_USED',
            backupCodesRemaining: verifyResult.backupCodesRemaining,
          }
        : {}),
    };
  }

  async logout(
    sessionId: string | undefined,
    userId: string | undefined,
    wsId: string | undefined,
    ip: string | undefined,
    ua: string | undefined,
    res: Response,
  ): Promise<void> {
    if (sessionId) {
      await this.sessionService.revoke(
        sessionId,
        SessionRevokedReason.LOGOUT,
        userId,
      );
      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        workspaceId: wsId,
        ipAddress: ip,
        userAgent: ua,
      });
    }
    this.sessionCookieService.clear(res, 'tenant');
  }

  async getMe(authContext?: IAuthContext): Promise<IAuthMeResponse> {
    if (!authContext?.userId) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Authentication required.',
      });
    }

    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: authContext.userId },
      relations: { role: true, workspace: true },
    });

    if (!user || !user.workspace) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'User session not found.',
      });
    }

    return {
      user: mapUserToAuthUserDto(user, authContext.permissions ?? []),
      workspace: mapWorkspaceToSummaryDto(user.workspace),
    };
  }

  private async failLogin(
    user: User | null,
    reason: string,
    ip: string,
    ua: string | undefined,
  ): Promise<never> {
    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
      result: AuditResult.FAILURE,
      actorUserId: user?.id,
      metadata: { reason },
      ipAddress: ip,
      userAgent: ua,
    });
    throw new UnauthorizedException({
      code: ERROR_CODES.INVALID_CREDENTIALS,
      message: 'Invalid email or password.',
    });
  }
}
