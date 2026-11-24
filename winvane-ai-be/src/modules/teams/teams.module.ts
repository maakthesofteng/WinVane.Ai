import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Team } from './entities/team.entity';
import { TeamMembership } from './entities/teamMembership.entity';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { AuditLogModule } from '../audit/auditLog.module';
import { AuthCoreModule } from '../auth-core/authCore.module';
import { RbacModule } from '../rbac/rbac.module';
import { TeamsController } from './controllers/teams.controller';
import { DepartmentsController } from './controllers/departments.controller';
import { TeamsQueryService } from './services/teamsQuery.service';
import { TeamsCommandService } from './services/teamsCommand.service';
import { TeamCompositionValidator } from './services/teamComposition.validator';
import { TeamPreconditionsService } from './services/teamPreconditions.service';
import { MembershipDiffService } from './services/membershipDiff.service';
import { DepartmentsService } from './services/departments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      Team,
      TeamMembership,
      User,
      Workspace,
    ]),
    AuditLogModule,
    AuthCoreModule,
    RbacModule,
  ],
  controllers: [TeamsController, DepartmentsController],
  providers: [
    TeamsQueryService,
    TeamsCommandService,
    TeamPreconditionsService,
    TeamCompositionValidator,
    MembershipDiffService,
    DepartmentsService,
  ],
  exports: [
    TypeOrmModule,
    TeamsQueryService,
    TeamsCommandService,
    TeamPreconditionsService,
    TeamCompositionValidator,
    DepartmentsService,
  ],
})
export class TeamsModule {}
