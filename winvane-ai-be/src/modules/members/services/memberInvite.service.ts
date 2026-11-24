import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../rbac/entities/role.entity';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { Invitation } from '../../invitations/entities/invitation.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { InvitationStatus } from '../../invitations/enums/invitationStatus.enum';
import { RedisService } from '../../redis/redis.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { CreateMemberInviteDto } from '../dto/createMemberInvite.dto';
import { IMemberRow } from '../interfaces/members.interface';
import { RoleAssignmentPolicyService } from './roleAssignmentPolicy.service';
import { MembersQueryService } from './membersQuery.service';
import { MemberInviteLifecycleService } from './memberInviteLifecycle.service';
import { InviteMemberEmailSender } from '../emails/inviteMember.email';

@Injectable()
export class MemberInviteService {
  private readonly logger = new Logger(MemberInviteService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly auditLogService: AuditLogService,
    private readonly roleAssignmentPolicyService: RoleAssignmentPolicyService,
    private readonly membersQueryService: MembersQueryService,
    private readonly memberInviteLifecycleService: MemberInviteLifecycleService,
    private readonly inviteMemberEmailSender: InviteMemberEmailSender,
  ) {}

  async invite(
    workspaceId: string,
    caller: IAuthContext,
    dto: CreateMemberInviteDto,
  ): Promise<IMemberRow> {
    const targetRole = await this.roleRepository.findOne({
      where: { id: dto.roleId },
      relations: {
        rolePermissions: {
          permission: true,
        },
      },
    });

    if (
      !targetRole ||
      (targetRole.workspaceId && targetRole.workspaceId !== workspaceId)
    ) {
      throw new ForbiddenException({
        message: 'Role does not belong to this workspace.',
        code: ERROR_CODES.ROLE_NOT_ASSIGNABLE,
      });
    }

    this.roleAssignmentPolicyService.assertCanAssignRole(caller, targetRole);

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'This email already belongs to a WinVane.ai account.',
        code: ERROR_CODES.EMAIL_ALREADY_REGISTERED,
      });
    }

    const rateLimitKey = `ratelimit:workspace_invite:${workspaceId}`;
    const currentCount = await this.redisService.incr(rateLimitKey, 3600);
    if (currentCount > 50) {
      throw new HttpException(
        'Workspace invite limit reached (50/hr). Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    const workspaceName = workspace ? workspace.name : 'Your Workspace';

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const createdUserId = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const invRepo = manager.getRepository(Invitation);

      const newUser = userRepo.create({
        email,
        fullName: dto.fullName.trim(),
        phone: dto.phone ? dto.phone.trim() : null,
        jobTitle: dto.jobTitle ? dto.jobTitle.trim() : null,
        workspaceId,
        roleId: targetRole.id,
        status: UserStatus.INVITED,
        passwordHash: null,
        invitedById: caller.userId,
      });
      const savedUser = await userRepo.save(newUser);

      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const invitation = invRepo.create({
        workspaceId,
        userId: savedUser.id,
        email,
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedById: caller.userId,
        lastSentAt: new Date(),
        sendCount: 1,
      });
      await invRepo.save(invitation);

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.MEMBER_INVITED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'user',
          targetId: savedUser.id,
          metadata: {
            roleId: targetRole.id,
            roleName: targetRole.name,
            email: savedUser.email,
          },
        },
        manager,
      );

      return savedUser.id;
    });

    try {
      await this.inviteMemberEmailSender.send({
        to: email,
        fullName: dto.fullName.trim(),
        inviterName: caller.fullName,
        workspaceName,
        roleName: targetRole.name,
        rawToken,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send member invitation email to ${email}: ${
          error instanceof Error ? error.stack : String(error)
        }`,
      );
    }

    return this.membersQueryService.detail(
      workspaceId,
      createdUserId,
      caller.userId,
    );
  }

  async resendInvite(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    return this.memberInviteLifecycleService.resendInvite(
      workspaceId,
      memberId,
      caller,
    );
  }

  async revokeInvite(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    return this.memberInviteLifecycleService.revokeInvite(
      workspaceId,
      memberId,
      caller,
    );
  }
}
