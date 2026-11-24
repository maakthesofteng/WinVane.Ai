import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, In } from 'typeorm';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { AuditLogService } from '../../audit/auditLog.service';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { WorkspaceStatus } from '../../workspace/enums/workspaceStatus.enum';
import { User } from '../../users/entities/user.entity';
import { DomainVerificationToken } from '../entities/domainVerificationToken.entity';
import { PasswordResetToken } from '../entities/passwordResetToken.entity';

@Injectable()
export class AuthCleanupJob {
  private readonly logger = new Logger(AuthCleanupJob.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<{
    verificationTokensDeleted: number;
    resetTokensDeleted: number;
  }> {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const vResult = await this.dataSource
      .getRepository(DomainVerificationToken)
      .createQueryBuilder()
      .delete()
      .from(DomainVerificationToken)
      .where(
        '(usedAt IS NOT NULL AND usedAt < :cutoff) OR (expiresAt < :cutoff)',
        {
          cutoff: cutoff7d,
        },
      )
      .execute();

    const pResult = await this.dataSource
      .getRepository(PasswordResetToken)
      .createQueryBuilder()
      .delete()
      .from(PasswordResetToken)
      .where(
        '(usedAt IS NOT NULL AND usedAt < :cutoff) OR (expiresAt < :cutoff)',
        {
          cutoff: cutoff7d,
        },
      )
      .execute();

    const verificationTokensDeleted = vResult.affected ?? 0;
    const resetTokensDeleted = pResult.affected ?? 0;

    if (verificationTokensDeleted > 0 || resetTokensDeleted > 0) {
      this.logger.log(
        `Purged expired tokens: ${verificationTokensDeleted} verification, ${resetTokensDeleted} reset`,
      );
      await this.auditLogService.record({
        action: AUDIT_ACTIONS.SYSTEM_CLEANUP_EXPIRED_TOKENS,
        result: AuditResult.SUCCESS,
        metadata: { verificationTokensDeleted, resetTokensDeleted },
      });
    }

    return { verificationTokensDeleted, resetTokensDeleted };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupPendingWorkspaces(): Promise<{ purgedWorkspaces: number }> {
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const pendingWorkspaces = await this.dataSource
      .getRepository(Workspace)
      .createQueryBuilder('ws')
      .where('ws.status = :status AND ws.createdAt < :cutoff', {
        status: WorkspaceStatus.PENDING_VERIFICATION,
        cutoff: cutoff48h,
      })
      .getMany();

    if (pendingWorkspaces.length === 0) {
      return { purgedWorkspaces: 0 };
    }

    const wsIds = pendingWorkspaces.map((w) => w.id);

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(DomainVerificationToken)
        .createQueryBuilder()
        .delete()
        .from(DomainVerificationToken)
        .where('workspaceId IN (:...wsIds)', { wsIds })
        .execute();

      await manager
        .getRepository(User)
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('workspaceId IN (:...wsIds)', { wsIds })
        .execute();

      await manager.getRepository(Workspace).delete({ id: In(wsIds) });
    });

    const purgedWorkspaces = pendingWorkspaces.length;
    this.logger.log(`Purged ${purgedWorkspaces} stale pending workspaces`);

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.SYSTEM_CLEANUP_PENDING_WORKSPACES,
      result: AuditResult.SUCCESS,
      metadata: { purgedCount: purgedWorkspaces },
    });

    return { purgedWorkspaces };
  }
}
