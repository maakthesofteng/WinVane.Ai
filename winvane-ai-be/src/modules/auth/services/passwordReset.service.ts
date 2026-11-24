import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, IsNull, MoreThan } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/constants';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { PasswordService } from '../../auth-core/services/password.service';
import { TokenService } from '../../auth-core/services/token.service';
import { SessionService } from '../../auth-core/services/session.service';
import { LoginAttemptService } from '../../auth-core/services/loginAttempt.service';
import { MailService } from '../../mail/mail.service';
import { SessionRevokedReason } from '../enums/sessionRevokedReason.enum';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { PasswordResetToken } from '../entities/passwordResetToken.entity';
import { ForgotPasswordDto } from '../dto/forgotPassword.dto';
import { ResetPasswordDto } from '../dto/resetPassword.dto';
import {
  IGenericMessageResponse,
  IRedirectMessageResponse,
} from '../interfaces/authResponse.interface';
import { passwordChangedEmail, passwordResetEmail } from '../emails/templates';

const GENERIC_FORGOT_MESSAGE =
  "If an account exists for that email, we've sent a reset link.";

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly mailService: MailService,
    private readonly auditLogService: AuditLogService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IGenericMessageResponse> {
    const cooldownKey = `cooldown:forgot_pw:email:${dto.email}`;
    const dailyKey = `cooldown:forgot_pw:email:daily:${dto.email}`;

    const [isCoolingDown, dailyCountStr] = await Promise.all([
      this.redis.get(cooldownKey),
      this.redis.get(dailyKey),
    ]);

    const dailyCount = dailyCountStr ? parseInt(dailyCountStr, 10) : 0;
    if (isCoolingDown || dailyCount >= 5) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: dto.email },
      relations: { role: true },
    });

    const isEligibleTenantUser =
      user &&
      user.role &&
      !user.role.isPlatformRole &&
      user.status === UserStatus.ACTIVE;

    if (!isEligibleTenantUser) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    await this.redis.set(cooldownKey, '1', 'EX', 60);
    const updatedDaily = await this.redis.incr(dailyKey);
    if (updatedDaily === 1) {
      await this.redis.expire(dailyKey, 86400);
    }

    const rawToken = this.tokenService.generate();
    const tokenHash = this.tokenService.hash(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const tokenRepo = this.dataSource.getRepository(PasswordResetToken);
    await tokenRepo
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: new Date() })
      .where('userId = :userId AND usedAt IS NULL', { userId: user.id })
      .execute();

    const newToken = tokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await tokenRepo.save(newToken);

    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      '';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    const emailData = await passwordResetEmail({
      fullName: user.fullName,
      resetUrl,
      expiresHours: 1,
    });

    await this.mailService.enqueue({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      workspaceId: user.workspaceId ?? undefined,
      ipAddress,
      userAgent,
    });

    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IRedirectMessageResponse> {
    const tokenHash = this.tokenService.hash(dto.token);
    const token = await this.dataSource
      .getRepository(PasswordResetToken)
      .findOne({
        where: {
          tokenHash,
          usedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
      });

    if (!token) {
      throw new BadRequestException({
        code: ERROR_CODES.TOKEN_INVALID,
        message: 'This link is invalid or has expired.',
      });
    }

    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id: token.userId })
      .getOne();

    if (
      !user ||
      !user.passwordHash ||
      !user.role ||
      user.role.isPlatformRole ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestException({
        code: ERROR_CODES.TOKEN_INVALID,
        message: 'This link is invalid or has expired.',
      });
    }

    this.passwordService.assertPolicy(dto.newPassword, user.email);

    const isSamePassword = await this.passwordService.verify(
      user.passwordHash,
      dto.newPassword,
    );
    if (isSamePassword) {
      throw new BadRequestException({
        code: ERROR_CODES.PASSWORD_POLICY,
        message: 'New password must differ from your current password.',
      });
    }

    const newHash = await this.passwordService.hash(dto.newPassword);
    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(User)
        .createQueryBuilder()
        .update(User)
        .set({ passwordHash: newHash, passwordChangedAt: now })
        .where('id = :id', { id: user.id })
        .execute();

      await manager
        .getRepository(PasswordResetToken)
        .createQueryBuilder()
        .update(PasswordResetToken)
        .set({ usedAt: now })
        .where('userId = :userId AND usedAt IS NULL', { userId: user.id })
        .execute();
    });

    await this.loginAttemptService.resetAttempts(user.email);
    await this.sessionService.revokeAllForUser(
      user.id,
      SessionRevokedReason.PASSWORD_RESET,
    );

    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      '';
    const loginUrl = `${frontendUrl}/login`;
    const emailData = await passwordChangedEmail({
      fullName: user.fullName,
      loginUrl,
    });

    await this.mailService.enqueue({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_COMPLETED,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      workspaceId: user.workspaceId ?? undefined,
      ipAddress,
      userAgent,
    });

    return {
      message: 'Password updated. Please sign in.',
      redirectTo: '/login',
    };
  }
}
