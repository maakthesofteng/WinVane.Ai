import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PasswordService } from '../../auth-core/services/password.service';
import { SessionService } from '../../auth-core/services/session.service';
import { SessionRevokedReason } from '../../auth/enums/sessionRevokedReason.enum';
import { AuthContextService } from '../../auth-core/services/authContext.service';
import { MailService } from '../../mail/mail.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { StepUpService } from './stepUp.service';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { ChangePasswordDto } from '../dto';
import { passwordChangedEmail } from '../../auth/emails/templates';

@Injectable()
export class PasswordChangeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly authContextService: AuthContextService,
    private readonly mailService: MailService,
    private readonly auditLogService: AuditLogService,
    private readonly stepUpService: StepUpService,
    private readonly configService: ConfigService,
  ) {}

  async changePassword(
    auth: IAuthContext,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: auth.userId })
      .getOne();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found or no password set.');
    }

    await this.stepUpService.assertCurrentPassword(user, dto.currentPassword);

    const isSamePassword = await this.passwordService.verify(
      user.passwordHash,
      dto.newPassword,
    );

    if (isSamePassword) {
      throw new BadRequestException({
        message: 'New password cannot be the same as your current password.',
        code: ERROR_CODES.PASSWORD_POLICY,
      });
    }

    this.passwordService.assertPolicy(dto.newPassword, user.email);

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);
    const now = new Date();

    await this.userRepository.update(
      { id: user.id },
      {
        passwordHash: newPasswordHash,
        passwordChangedAt: now,
      },
    );

    // Revoke ALL other sessions across all portals (keep caller session)
    await this.sessionService.revokeAllForUser(
      user.id,
      SessionRevokedReason.PASSWORD_CHANGED,
      { exceptSessionId: auth.sessionId },
    );

    await this.authContextService.invalidate(user.id);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_PASSWORD_CHANGED,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      targetType: 'user',
      targetId: user.id,
    });

    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      '';
    const loginUrl =
      auth.portal === 'admin'
        ? `${frontendUrl}/login/superadmin`
        : `${frontendUrl}/login`;

    const emailContent = await passwordChangedEmail({
      fullName: user.fullName,
      loginUrl,
    });

    await this.mailService.enqueue({
      to: user.email,
      ...emailContent,
    });
  }
}
