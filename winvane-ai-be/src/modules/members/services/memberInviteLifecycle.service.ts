import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../../users/entities/user.entity';
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
import { IMemberRow } from '../interfaces/members.interface';
import { MembersQueryService } from './membersQuery.service';
import { InviteMemberEmailSender } from '../emails/inviteMember.email';

@Injectable()
export class MemberInviteLifecycleService {
  private readonly logger = new Logger(MemberInviteLifecycleService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly auditLogService: AuditLogService,
    private readonly membersQueryService: MembersQueryService,
    private readonly inviteMemberEmailSender: InviteMemberEmailSender,
  ) {}

  async resendInvite(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    const user = await this.userRepository.findOne({
      where: { id: memberId, workspaceId },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Member not found.');
    }

    const hasNeverAccepted =
      user.status === UserStatus.INVITED ||
      (user.status === UserStatus.INACTIVE && user.passwordHash === null);

    if (!hasNeverAccepted) {
      throw new ConflictException({
        message: 'Invite cannot be resent for this member.',
        code: ERROR_CODES.INVITE_NOT_APPLICABLE,
      });
    }

    const cooldownKey = `ratelimit:invite_cooldown:${memberId}`;
    if (await this.redisService.exists(cooldownKey)) {
      throw new HttpException(
        'Please wait 60 seconds before resending an invite.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const dayLimitKey = `ratelimit:invite_day:${memberId}`;
    const dayCount = await this.redisService.incr(dayLimitKey, 86400);
    if (dayCount > 10) {
      throw new HttpException(
        'Maximum resend limit (10/day) reached for this member.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    const workspaceName = workspace ? workspace.name : 'Your Workspace';

    const latestInvitation = await this.invitationRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    const newSendCount = (latestInvitation?.sendCount ?? 1) + 1;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Invitation);
      const userRepo = manager.getRepository(User);

      await invRepo.update(
        { userId: user.id, status: InvitationStatus.PENDING },
        {
          status: InvitationStatus.REVOKED,
          revokedAt: new Date(),
          revokedById: null,
        },
      );

      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const newInv = invRepo.create({
        workspaceId,
        userId: user.id,
        email: user.email,
        tokenHash,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedById: caller.userId,
        lastSentAt: new Date(),
        sendCount: newSendCount,
      });
      await invRepo.save(newInv);

      await userRepo.update({ id: user.id }, { status: UserStatus.INVITED });

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.MEMBER_INVITE_RESENT,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'user',
          targetId: user.id,
          metadata: { email: user.email, sendCount: newSendCount },
        },
        manager,
      );
    });

    await this.redisService.set(cooldownKey, '1', 60);

    try {
      await this.inviteMemberEmailSender.send({
        to: user.email,
        fullName: user.fullName,
        inviterName: caller.fullName,
        workspaceName,
        roleName: user.role?.name ?? 'Member',
        rawToken,
      });
    } catch (error) {
      this.logger.error(
        `Failed to resend member invitation email to ${user.email}: ${
          error instanceof Error ? error.stack : String(error)
        }`,
      );
    }

    return this.membersQueryService.detail(workspaceId, user.id, caller.userId);
  }

  async revokeInvite(
    workspaceId: string,
    memberId: string,
    caller: IAuthContext,
  ): Promise<IMemberRow> {
    const user = await this.userRepository.findOne({
      where: { id: memberId, workspaceId },
    });

    if (!user) {
      throw new NotFoundException('Member not found.');
    }

    const pendingInvitation = await this.invitationRepository.findOne({
      where: { userId: user.id, status: InvitationStatus.PENDING },
    });

    if (!pendingInvitation) {
      throw new ConflictException({
        message: 'No pending invitation found for this member.',
        code: ERROR_CODES.INVITE_NOT_APPLICABLE,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Invitation);
      const userRepo = manager.getRepository(User);

      await invRepo.update(
        { id: pendingInvitation.id },
        {
          status: InvitationStatus.REVOKED,
          revokedAt: new Date(),
          revokedById: caller.userId,
        },
      );

      await userRepo.update({ id: user.id }, { status: UserStatus.INACTIVE });

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.MEMBER_INVITE_REVOKED,
          result: AuditResult.SUCCESS,
          actorUserId: caller.userId,
          workspaceId,
          targetType: 'user',
          targetId: user.id,
          metadata: { email: user.email },
        },
        manager,
      );
    });

    return this.membersQueryService.detail(workspaceId, user.id, caller.userId);
  }
}
