import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamMembership } from '../teams/entities/teamMembership.entity';
import { AuthCoreModule } from '../auth-core/authCore.module';
import { AuditLogModule } from '../audit/auditLog.module';
import { RedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';

import { MembersController } from './controllers/members.controller';
import { InvitationsController } from './controllers/invitations.controller';
import { RoleAssignmentPolicyService } from './services/roleAssignmentPolicy.service';
import { MembersQueryService } from './services/membersQuery.service';
import { MemberInviteService } from './services/memberInvite.service';
import { MemberInviteLifecycleService } from './services/memberInviteLifecycle.service';
import { MemberManagementService } from './services/memberManagement.service';
import { MemberStatusService } from './services/memberStatus.service';
import { InvitationAcceptService } from './services/invitationAccept.service';
import { InviteMemberEmailSender } from './emails/inviteMember.email';
import { ExpireInvitationsJob } from './jobs/expireInvitations.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Workspace,
      Invitation,
      Team,
      TeamMembership,
    ]),
    AuthCoreModule,
    AuditLogModule,
    RedisModule,
    MailModule,
  ],
  controllers: [MembersController, InvitationsController],
  providers: [
    RoleAssignmentPolicyService,
    MembersQueryService,
    MemberInviteService,
    MemberInviteLifecycleService,
    MemberManagementService,
    MemberStatusService,
    InvitationAcceptService,
    InviteMemberEmailSender,
    ExpireInvitationsJob,
  ],
  exports: [
    RoleAssignmentPolicyService,
    MembersQueryService,
    MemberInviteService,
    MemberManagementService,
    InvitationAcceptService,
  ],
})
export class MembersModule {}
