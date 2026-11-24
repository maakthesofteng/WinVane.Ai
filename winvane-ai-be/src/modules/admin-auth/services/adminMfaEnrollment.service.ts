import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Response } from 'express';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { MfaService } from '../../auth-core/services/mfa.service';
import { MfaChallengeService } from '../../auth-core/services/mfaChallenge.service';
import { SessionService } from '../../auth-core/services/session.service';
import { SessionCookieService } from '../../auth-core/services/sessionCookie.service';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { SessionRevokedReason } from '../../auth/enums/sessionRevokedReason.enum';
import { MailService } from '../../mail/mail.service';
import { User } from '../../users/entities/user.entity';
import { ROLE_NAMES } from '../../rbac/constants';
import { fetchRolePermissions } from '../../auth/utils/authDto.mapper';
import { adminLoginNotificationEmail } from '../emails/adminLoginNotification.email';
import { mapUserToAdminUserDto } from '../utils/adminDto.mapper';
import {
  AdminMfaCodeDto,
  AdminMfaSetupResponseDto,
  AdminMfaSetupConfirmResponseDto,
  AdminMfaVerifyResponseDto,
  AdminMeResponseDto,
} from '../dto';

@Injectable()
export class AdminMfaEnrollmentService {
  private readonly logger = new Logger(AdminMfaEnrollmentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly mfaService: MfaService,
    private readonly mfaChallengeService: MfaChallengeService,
    private readonly sessionService: SessionService,
    private readonly sessionCookieService: SessionCookieService,
    private readonly auditLogService: AuditLogService,
    private readonly mailService: MailService,
  ) {}

  async beginSetup(
    chCookie: string | undefined,
    ua: string | undefined,
  ): Promise<AdminMfaSetupResponseDto> {
    if (!chCookie) {
      this.logger.warn(
        'beginSetup: MFA challenge cookie is missing from request.',
      );
      throw new UnauthorizedException({
        code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
        message: 'MFA challenge expired. Please login again.',
      });
    }

    const ch = await this.mfaChallengeService.get(
      chCookie,
      'admin',
      'setup',
      ua,
    );
    const user = await this.loadAdminUser(ch.userId);

    const { otpauthUrl, secret } = await this.mfaService.beginSetup(
      user.id,
      user.email,
    );

    return { otpauthUrl, secret };
  }

  async confirmSetup(
    dto: AdminMfaCodeDto,
    chCookie: string | undefined,
    ip: string,
    ua: string | undefined,
    res: Response,
  ): Promise<AdminMfaSetupConfirmResponseDto> {
    if (!chCookie) {
      this.logger.warn(
        'confirmSetup: MFA challenge cookie is missing from request.',
      );
      throw new UnauthorizedException({
        code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
        message: 'MFA challenge expired. Please login again.',
      });
    }

    const ch = await this.mfaChallengeService.get(
      chCookie,
      'admin',
      'setup',
      ua,
    );
    const user = await this.loadAdminUser(ch.userId);

    let backupCodes: string[];
    try {
      const result = await this.mfaService.confirmSetup(user.id, dto.code);
      backupCodes = result.backupCodes;
    } catch {
      await this.mfaChallengeService.registerFailure(chCookie, user, 'admin');
      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_MFA_CHALLENGE_FAILURE,
        result: AuditResult.FAILURE,
        actorUserId: user.id,
        ipAddress: ip,
        userAgent: ua,
      });
      throw new UnauthorizedException({
        code: ERROR_CODES.MFA_INVALID,
        message: 'Invalid verification code.',
      });
    }

    await this.mfaChallengeService.consume(chCookie);
    this.sessionCookieService.clearMfaChallenge(res);

    // Defensive: revoke prior admin sessions
    await this.sessionService.revokeAllForUser(
      user.id,
      SessionRevokedReason.ADMIN_ACTION,
      { portal: 'admin' },
    );

    const { jwt, expiresAt } = await this.sessionService.create({
      userId: user.id,
      portal: 'admin',
      ipAddress: ip,
      userAgent: ua || 'unknown',
    });

    this.sessionCookieService.set(res, 'admin', jwt, expiresAt);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ADMIN_LOGIN_SUCCESS,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      ipAddress: ip,
      userAgent: ua,
      metadata: { stage: 'mfa_setup' },
    });

    await this.sendLoginNotification(user, ip, ua);
    const permissions = await fetchRolePermissions(
      this.dataSource,
      user.roleId,
    );

    return {
      status: 'authenticated',
      user: mapUserToAdminUserDto(user, permissions),
      backupCodes,
    };
  }

  async verifyMfa(
    dto: AdminMfaCodeDto,
    chCookie: string | undefined,
    ip: string,
    ua: string | undefined,
    res: Response,
  ): Promise<AdminMfaVerifyResponseDto> {
    if (!chCookie) {
      this.logger.warn(
        'verifyMfa: MFA challenge cookie is missing from request.',
      );
      throw new UnauthorizedException({
        code: ERROR_CODES.MFA_CHALLENGE_EXPIRED,
        message: 'MFA challenge expired. Please login again.',
      });
    }

    const ch = await this.mfaChallengeService.get(
      chCookie,
      'admin',
      'verify',
      ua,
    );
    const user = await this.loadAdminUser(ch.userId);

    let verifyResult: {
      method: 'totp' | 'backup_code';
      backupCodesRemaining?: number;
    };
    try {
      verifyResult = await this.mfaService.verify(user.id, dto.code);
    } catch {
      await this.mfaChallengeService.registerFailure(chCookie, user, 'admin');
      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_MFA_CHALLENGE_FAILURE,
        result: AuditResult.FAILURE,
        actorUserId: user.id,
        ipAddress: ip,
        userAgent: ua,
      });
      throw new UnauthorizedException({
        code: ERROR_CODES.MFA_INVALID,
        message: 'Invalid or expired MFA code.',
      });
    }

    await this.mfaChallengeService.consume(chCookie);
    this.sessionCookieService.clearMfaChallenge(res);

    const { jwt, expiresAt } = await this.sessionService.create({
      userId: user.id,
      portal: 'admin',
      ipAddress: ip,
      userAgent: ua || 'unknown',
    });

    this.sessionCookieService.set(res, 'admin', jwt, expiresAt);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.ADMIN_LOGIN_SUCCESS,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      ipAddress: ip,
      userAgent: ua,
      metadata: { stage: 'mfa', mfaMethod: verifyResult.method },
    });

    await this.sendLoginNotification(user, ip, ua);
    const permissions = await fetchRolePermissions(
      this.dataSource,
      user.roleId,
    );

    return {
      status: 'authenticated',
      user: mapUserToAdminUserDto(user, permissions),
      ...(verifyResult.method === 'backup_code'
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
        action: AUDIT_ACTIONS.ADMIN_LOGOUT,
        result: AuditResult.SUCCESS,
        actorUserId: userId,
        ipAddress: ip,
        userAgent: ua,
      });
    }
    this.sessionCookieService.clear(res, 'admin');
  }

  async getMe(auth?: IAuthContext): Promise<AdminMeResponseDto> {
    if (!auth?.userId) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Authentication required.',
      });
    }
    const user = await this.loadAdminUser(auth.userId);
    return {
      user: mapUserToAdminUserDto(user, auth?.permissions ?? []),
    };
  }

  private async loadAdminUser(userId: string): Promise<User> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (
      !user ||
      !user.role ||
      !user.role.isPlatformRole ||
      user.role.name !== ROLE_NAMES.SUPER_ADMIN
    ) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INVALID_CREDENTIALS,
        message: 'SuperAdmin user not found or not eligible.',
      });
    }

    return user;
  }

  private async sendLoginNotification(
    user: User,
    ip: string,
    ua: string | undefined,
  ): Promise<void> {
    try {
      const emailData = await adminLoginNotificationEmail({
        fullName: user.fullName,
        ipAddress: ip,
        userAgent: ua,
      });

      await this.mailService.enqueue({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
    } catch (err) {
      this.logger.error(
        `Failed to enqueue admin login notification email for user ${user.id}: ${String(err)}`,
      );
    }
  }
}
