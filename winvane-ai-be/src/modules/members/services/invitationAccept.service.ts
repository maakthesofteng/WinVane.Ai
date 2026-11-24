import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Invitation } from '../../invitations/entities/invitation.entity';
import { User } from '../../users/entities/user.entity';
import { InvitationStatus } from '../../invitations/enums/invitationStatus.enum';
import { UserStatus } from '../../users/enums/userStatus.enum';
import { PasswordService } from '../../auth-core/services/password.service';
import { AuthContextService } from '../../auth-core/services/authContext.service';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';
import { AcceptInviteDto } from '../dto/acceptInvite.dto';
import {
  IInvitationAcceptResponse,
  IInvitationValidateResponse,
} from '../interfaces/members.interface';

@Injectable()
export class InvitationAcceptService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly authContextService: AuthContextService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async validateToken(rawToken: string): Promise<IInvitationValidateResponse> {
    if (!rawToken || rawToken.trim().length === 0) {
      throw new BadRequestException({
        message: 'Invalid invitation token.',
        code: ERROR_CODES.INVITE_INVALID,
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const invitation = await this.invitationRepository.findOne({
      where: { tokenHash },
      relations: {
        workspace: true,
        user: {
          role: true,
        },
      },
    });

    if (!invitation || !invitation.user || !invitation.workspace) {
      throw new BadRequestException({
        message: 'Invitation is invalid or has already been used.',
        code: ERROR_CODES.INVITE_INVALID,
      });
    }

    if (
      invitation.status === InvitationStatus.REVOKED ||
      invitation.status === InvitationStatus.ACCEPTED
    ) {
      throw new BadRequestException({
        message: 'Invitation is invalid or has already been used.',
        code: ERROR_CODES.INVITE_INVALID,
      });
    }

    if (new Date() > invitation.expiresAt) {
      if (invitation.status === InvitationStatus.PENDING) {
        await this.invitationRepository.update(
          { id: invitation.id },
          { status: InvitationStatus.EXPIRED },
        );
      }
      throw new HttpException(
        {
          message: 'Invitation has expired.',
          code: ERROR_CODES.INVITE_EXPIRED,
        },
        HttpStatus.GONE,
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException({
        message: 'Invitation is invalid or has already been used.',
        code: ERROR_CODES.INVITE_INVALID,
      });
    }

    return {
      workspaceName: invitation.workspace.name,
      fullName: invitation.user.fullName,
      email: invitation.email,
      roleName: invitation.user.role?.name ?? 'Member',
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async accept(dto: AcceptInviteDto): Promise<IInvitationAcceptResponse> {
    if (!dto.token || dto.token.trim().length === 0) {
      throw new BadRequestException({
        message: 'Invalid invitation token.',
        code: ERROR_CODES.INVITE_INVALID,
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    let acceptedUserId: string | null = null;

    await this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Invitation);
      const userRepo = manager.getRepository(User);

      const invitation = await invRepo.findOne({
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      if (!invitation) {
        throw new BadRequestException({
          message: 'Invitation is invalid or has already been used.',
          code: ERROR_CODES.INVITE_INVALID,
        });
      }

      const user = await userRepo.findOne({
        where: { id: invitation.userId },
      });

      if (!user) {
        throw new BadRequestException({
          message: 'Invitation is invalid or has already been used.',
          code: ERROR_CODES.INVITE_INVALID,
        });
      }

      if (
        invitation.status === InvitationStatus.REVOKED ||
        invitation.status === InvitationStatus.ACCEPTED
      ) {
        throw new BadRequestException({
          message: 'Invitation is invalid or has already been used.',
          code: ERROR_CODES.INVITE_INVALID,
        });
      }

      if (new Date() > invitation.expiresAt) {
        if (invitation.status === InvitationStatus.PENDING) {
          await invRepo.update(
            { id: invitation.id },
            { status: InvitationStatus.EXPIRED },
          );
        }
        throw new HttpException(
          {
            message: 'Invitation has expired.',
            code: ERROR_CODES.INVITE_EXPIRED,
          },
          HttpStatus.GONE,
        );
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException({
          message: 'Invitation is invalid or has already been used.',
          code: ERROR_CODES.INVITE_INVALID,
        });
      }

      this.passwordService.assertPolicy(dto.password, invitation.email);
      const passwordHash = await this.passwordService.hash(dto.password);

      const now = new Date();
      await userRepo.update(
        { id: invitation.userId },
        {
          passwordHash,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: now,
          passwordChangedAt: now,
        },
      );

      await invRepo.update(
        { id: invitation.id },
        {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: now,
        },
      );

      await this.auditLogService.record(
        {
          action: AUDIT_ACTIONS.MEMBER_INVITE_ACCEPTED,
          result: AuditResult.SUCCESS,
          actorUserId: invitation.userId,
          workspaceId: invitation.workspaceId,
          targetType: 'user',
          targetId: invitation.userId,
          metadata: { email: invitation.email },
        },
        manager,
      );

      acceptedUserId = invitation.userId;
    });

    if (acceptedUserId) {
      await this.authContextService.invalidate(acceptedUserId);
    }

    return {
      message: 'Your account is ready. Please sign in.',
      redirectTo: '/login',
    };
  }
}
