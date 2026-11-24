import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/constants';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { ROLE_NAMES } from '../../rbac/constants/roles.constants';
import { WorkspaceRoleProvisioner } from '../../rbac/services/workspaceRoleProvisioner.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { PasswordService } from '../../auth-core/services/password.service';
import { TokenService } from '../../auth-core/services/token.service';
import { MailService } from '../../mail/mail.service';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { WorkspaceStatus } from '../../workspace/enums/workspaceStatus.enum';
import { WorkspaceVerificationMethod } from '../../workspace/enums/workspaceVerificationMethod.enum';
import { Role } from '../../rbac/entities/role.entity';
import { DomainVerificationToken } from '../entities/domainVerificationToken.entity';
import { FreeEmailDomainService } from './freeEmailDomain.service';
import { RegisterDto } from '../dto/register.dto';
import { IGenericMessageResponse } from '../interfaces/authResponse.interface';
import { verificationEmail, workspaceExistsEmail } from '../emails/templates';

const GENERIC_REGISTER_MESSAGE =
  "If the details are valid, we've sent a verification link to your inbox.";

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly auditLogService: AuditLogService,
    private readonly freeEmailDomainService: FreeEmailDomainService,
    private readonly workspaceRoleProvisioner: WorkspaceRoleProvisioner,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<IGenericMessageResponse> {
    const domain = this.freeEmailDomainService.extractDomain(dto.email);
    if (!domain || this.freeEmailDomainService.isFreeEmail(dto.email)) {
      throw new BadRequestException({
        code: ERROR_CODES.FREE_EMAIL_DOMAIN,
        message: 'Please register with your company email address.',
      });
    }

    this.passwordService.assertPolicy(dto.password, dto.email);
    const passwordHash = await this.passwordService.hash(dto.password);

    const existingUser = await this.dataSource.getRepository(User).findOne({
      where: { email: dto.email },
      relations: { workspace: true, role: true },
    });

    const existingWorkspace = await this.dataSource
      .getRepository(Workspace)
      .findOne({ where: { domain } });

    const isPendingOwner =
      existingUser &&
      existingWorkspace &&
      existingUser.id === existingWorkspace.ownerUserId &&
      existingUser.status === UserStatus.PENDING &&
      existingWorkspace.status === WorkspaceStatus.PENDING_VERIFICATION;

    if (isPendingOwner) {
      await this.handlePendingOwnerResend(existingUser, existingWorkspace);
      return { message: GENERIC_REGISTER_MESSAGE };
    }

    if (existingUser || existingWorkspace) {
      await this.handleDuplicateRegistration(dto, domain, ipAddress, userAgent);
      return { message: GENERIC_REGISTER_MESSAGE };
    }

    await this.handleNewCompanyRegistration(
      dto,
      domain,
      passwordHash,
      ipAddress,
      userAgent,
    );

    return { message: GENERIC_REGISTER_MESSAGE };
  }

  private async handlePendingOwnerResend(
    user: User,
    workspace: Workspace,
  ): Promise<void> {
    const tokenRepo = this.dataSource.getRepository(DomainVerificationToken);
    await tokenRepo
      .createQueryBuilder()
      .update(DomainVerificationToken)
      .set({ usedAt: new Date() })
      .where('userId = :userId AND usedAt IS NULL', { userId: user.id })
      .execute();

    const rawToken = this.tokenService.generate();
    const tokenHash = this.tokenService.hash(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newToken = tokenRepo.create({
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      tokenHash,
      expiresAt,
    });
    await tokenRepo.save(newToken);

    const frontendUrl = this.getFrontendUrl();
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
  }

  private async handleDuplicateRegistration(
    dto: RegisterDto,
    domain: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const rateLimitKey = `ratelimit:email:ws_exists:${dto.email}`;
    const alreadySent = await this.redis.get(rateLimitKey);

    if (!alreadySent) {
      await this.redis.set(rateLimitKey, '1', 'EX', 3600);
      const frontendUrl = this.getFrontendUrl();
      const loginUrl = `${frontendUrl}/login`;
      const emailData = await workspaceExistsEmail({
        fullName: dto.fullName,
        domain,
        loginUrl,
      });

      await this.mailService.enqueue({
        to: dto.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });
    }

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.AUTH_REGISTER_DUPLICATE,
      result: AuditResult.FAILURE,
      metadata: { domain },
      ipAddress,
      userAgent,
    });
  }

  private async handleNewCompanyRegistration(
    dto: RegisterDto,
    domain: string,
    passwordHash: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const rawToken = this.tokenService.generate();
    const tokenHash = this.tokenService.hash(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let createdUser: User | null = null;
    let createdWorkspace: Workspace | null = null;

    await this.dataSource.transaction(async (manager) => {
      const ownerRole = await manager
        .getRepository(Role)
        .findOne({ where: { name: ROLE_NAMES.OWNER } });

      if (!ownerRole) {
        throw new Error('Owner role not seeded');
      }

      const workspace = manager.getRepository(Workspace).create({
        name: dto.companyName,
        domain,
        status: WorkspaceStatus.PENDING_VERIFICATION,
        verificationMethod: WorkspaceVerificationMethod.EMAIL_DOMAIN,
      });
      const savedWorkspace = await manager
        .getRepository(Workspace)
        .save(workspace);

      const user = manager.getRepository(User).create({
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        roleId: ownerRole.id,
        workspaceId: savedWorkspace.id,
        status: UserStatus.PENDING,
      });
      const savedUser = await manager.getRepository(User).save(user);

      savedWorkspace.ownerUserId = savedUser.id;
      await manager.getRepository(Workspace).save(savedWorkspace);

      // Provision workspace system roles (Admin, Manager, Member copies)
      await this.workspaceRoleProvisioner.provision(savedWorkspace.id, manager);

      const token = manager.getRepository(DomainVerificationToken).create({
        userId: savedUser.id,
        workspaceId: savedWorkspace.id,
        email: savedUser.email,
        tokenHash,
        expiresAt,
      });
      await manager.getRepository(DomainVerificationToken).save(token);

      createdUser = savedUser;
      createdWorkspace = savedWorkspace;
    });

    if (createdUser && createdWorkspace) {
      const userRef: User = createdUser;
      const wsRef: Workspace = createdWorkspace;

      const frontendUrl = this.getFrontendUrl();
      const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`;
      const emailData = await verificationEmail({
        fullName: dto.fullName,
        verificationUrl,
        expiresHours: 24,
      });

      await this.mailService.enqueue({
        to: dto.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      await this.auditLogService.record({
        action: AUDIT_ACTIONS.AUTH_REGISTER,
        result: AuditResult.SUCCESS,
        actorUserId: userRef.id,
        workspaceId: wsRef.id,
        metadata: { domain },
        ipAddress,
        userAgent,
      });
    }
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('app.frontendUrl') ||
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      ''
    );
  }
}
