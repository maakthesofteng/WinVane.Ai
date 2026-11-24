import { TAuditAction } from '../constants/auditActions.constants';
import { TAuditResult } from '../enums/auditResult.enum';

export interface IAuditEntry {
  action: TAuditAction;
  result: TAuditResult;
  actorUserId?: string | null;
  workspaceId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuditPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IAuditLogFilters {
  workspaceId?: string;
  actorUserId?: string;
  action?: TAuditAction;
  result?: TAuditResult;
  startDate?: Date;
  endDate?: Date;
}
