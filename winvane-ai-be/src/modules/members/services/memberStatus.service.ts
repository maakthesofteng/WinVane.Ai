import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { SessionService } from '../../auth-core/services/session.service';
import { AuthContextService } from '../../auth-core/services/authContext.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { IAuthContext } from '../../auth-core/interfaces/authContext.interface';
import { IMemberRow } from '../interfaces/members.interface';
import { RoleAssignmentPolicyService } from './roleAssignmentPolicy.service';
import { MembersQueryService } from './membersQuery.service';

@Injectable()
export class MemberStatusService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly sessionService: SessionService,
    private readonly authContextService: AuthContextService,
    private readonly auditLogService: AuditLogService,
    private readonly roleAssignmentPolicyService: RoleAssignmentPolicyService,
    private readonly membersQueryService: MembersQueryService,
  ) {}

  async deactivate(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    const targetUser = await this.userRepository.findOne({
      where: { id: memberId, workspaceId },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Member not found.');
    }

    this.roleAssignmentPolicyService.assertNotSelfDeactivate(
      caller.userId,
      targetUser.id,
    );
    this.roleAssignmentPolicyService.assertCanManageTarget(caller, targetUser);

    if (targetUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Only active members can be deactivated.');
    }

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      await userRepo.update(
        { id: targetUser.id },
        {
          status: UserStatus.INACTIVE,
          deactivatedAt: now,
          deactivatedById: caller.userId,
        },
      );

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.MEMBER_DEACTIVATED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'user',
          targetId: targetUser.id,
          metadata: { email: targetUser.email },
        },
        manager,
      );
    });

    await this.sessionService.revokeAllForUser(targetUser.id, 'admin_action');
    await this.authContextService.invalidate(targetUser.id);

    return this.membersQueryService.detail(
      workspaceId,
      targetUser.id,
      caller.userId,
    );
  }

  async reactivate(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    const targetUser = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.rolePermissions', 'rp')
      .leftJoinAndSelect('rp.permission', 'perm')
      .where('user.id = :memberId AND user.workspace_id = :workspaceId', {
        memberId,
        workspaceId,
      })
      .getOne();

    if (!targetUser) {
      throw new NotFoundException('Member not found.');
    }

    this.roleAssignmentPolicyService.assertCanManageTarget(caller, targetUser);

    if (targetUser.status !== UserStatus.INACTIVE) {
      throw new BadRequestException(
        'Only inactive members can be reactivated.',
      );
    }

    if (!targetUser.passwordHash) {
      throw new ConflictException({
        message:
          'Member has never accepted an invitation. Use resend invite instead.',
        code: ERROR_CODES.INVITE_NOT_APPLICABLE,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      await userRepo.update(
        { id: targetUser.id },
        {
          status: UserStatus.ACTIVE,
          deactivatedAt: null,
          deactivatedById: null,
        },
      );

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.MEMBER_REACTIVATED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'user',
          targetId: targetUser.id,
          metadata: { email: targetUser.email },
        },
        manager,
      );
    });

    await this.authContextService.invalidate(targetUser.id);

    return this.membersQueryService.detail(
      workspaceId,
      targetUser.id,
      caller.userId,
    );
  }
}
