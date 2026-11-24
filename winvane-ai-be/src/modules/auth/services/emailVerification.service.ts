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
import { AuthContextService } from '../../auth-core/services/authContext.service';
import { TokenService } from '../../auth-core/services/token.service';
import { MailService } from '../../mail/mail.service';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { WorkspaceStatus } from '../../workspace/enums/workspaceStatus.enum';
import { DomainVerificationToken } from '../entities/domainVerificationToken.entity';
import { ResendVerificationDto } from '../dto/resendVerification.dto';
import { VerifyEmailDto } from '../dto/verifyEmail.dto';
import {
  IGenericMessageResponse,
  IRedirectMessageResponse,
} from '../interfaces/authResponse.interface';
import { verificationEmail } from '../emails/templates';

const GENERIC_VERIFICATION_MESSAGE =
  "If the details are valid, we've sent a verification link to your inbox.";

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly auditLogService: AuditLogService,
    private readonly authContextService: AuthContextService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async verifyEmail(
    dto: VerifyEmailDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IRedirectMessageResponse> {
    const tokenHash = this.tokenService.hash(dto.token);
    const tokenRepo = this.dataSource.getRepository(DomainVerificationToken);

    const token = await tokenRepo.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true, workspace: true },
    });

    if (!token || !token.user || !token.workspace) {
      throw new BadRequestException({
        code: ERROR_CODES.TOKEN_INVALID,
        message: 'This link is invalid or has expired.',
      });
    }

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(DomainVerificationToken)
        .createQueryBuilder()
        .update(DomainVerificationToken)
        .set({ usedAt: now })
        .where('userId = :userId AND usedAt IS NULL', { userId: token.userId })
        .execute();

      await manager
        .getRepository(User)
        .createQueryBuilder()
        .update(User)
        .set({ status: UserStatus.ACTIVE, emailVerifiedAt: now })
        .where('id = :id', { id: token.userId })
        .execute();

      await manager
        .getRepository(Workspace)
        .createQueryBuilder()
        .update(Workspace)
        .set({ status: WorkspaceStatus.ACTIVE, verifiedAt: now })
        .where('id = :id', { id: token.workspaceId })
        .execute();
    });

    await this.authContextService.invalidate(token.userId);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFIED,
      result: AuditResult.SUCCESS,
      actorUserId: token.userId,
      workspaceId: token.workspaceId,
      ipAddress,
      userAgent,
    });

    return {
      message: 'Email verified. You can now sign in.',
      redirectTo: '/login',
    };
  }

  async resendVerification(
    dto: ResendVerificationDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IGenericMessageResponse> {
    const cooldownKey = `cooldown:resend:email:${dto.email}`;
    const dailyKey = `cooldown:resend:email:daily:${dto.email}`;

    const [isCoolingDown, dailyCountStr] = await Promise.all([
      this.redis.get(cooldownKey),
      this.redis.get(dailyKey),
    ]);

    const dailyCount = dailyCountStr ? parseInt(dailyCountStr, 10) : 0;
    if (isCoolingDown || dailyCount >= 5) {
      return { message: GENERIC_VERIFICATION_MESSAGE };
    }

    const user = await this.dataSource.getRepository(User).findOne({
      where: { email: dto.email },
      relations: { workspace: true, role: true },
    });

    const isPendingOwner =
      user &&
      user.workspace &&
      user.role &&
      !user.role.isPlatformRole &&
      user.status === UserStatus.PENDING &&
      user.workspace.status === WorkspaceStatus.PENDING_VERIFICATION;

    if (!isPendingOwner || !user || !user.workspace) {
      return { message: GENERIC_VERIFICATION_MESSAGE };
    }

    await this.redis.set(cooldownKey, '1', 'EX', 60);
    const updatedDaily = await this.redis.incr(dailyKey);
    if (updatedDaily === 1) {
      await this.redis.expire(dailyKey, 86400);
    }

    const rawToken = this.tokenService.generate();
    const tokenHash = this.tokenService.hash(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tokenRepo = this.dataSource.getRepository(DomainVerificationToken);
    await tokenRepo
      .createQueryBuilder()
      .update(DomainVerificationToken)
      .set({ usedAt: new Date() })
      .where('userId = :userId AND usedAt IS NULL', { userId: user.id })
      .execute();

    const newToken = tokenRepo.create({
      userId: user.id,
      workspaceId: user.workspace.id,
      email: user.email,
      tokenHash,
      expiresAt,
    });
    await tokenRepo.save(newToken);

    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      '';
    const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`;
    const emailData = await verificationEmail({
      fullName: user.fullName,
      verificationUrl,
      expiresHours: 24,
    });

    await this.mailService.enqueue({
      to: user.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_VERIFICATION_RESENT,
      result: AuditResult.SUCCESS,
      actorUserId: user.id,
      workspaceId: user.workspaceId,
      ipAddress,
      userAgent,
    });

    return { message: GENERIC_VERIFICATION_MESSAGE };
  }
}
