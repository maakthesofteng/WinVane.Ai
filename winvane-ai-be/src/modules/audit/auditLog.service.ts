import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Request } from 'express';
import { AuditLog } from './entities/auditLog.entity';
import { AuditResult } from './enums/auditResult.enum';
import {
  IAuditEntry,
  IAuditLogFilters,
  IAuditPaginationOptions,
} from './interfaces/auditEntry.interface';

const SENSITIVE_KEY_REGEX = /password|token|secret|code|hash/i;
const MAX_METADATA_STRING_LENGTH = 500;
const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Records an audit log entry. Never throws to the caller.
   */
  async record(entry: IAuditEntry, manager?: EntityManager): Promise<void> {
    try {
      const sanitizedMeta = this.sanitizeMetadata(entry.metadata);
      const repo = manager
        ? manager.getRepository(AuditLog)
        : this.auditLogRepository;

      const log = repo.create({
        actorUserId: entry.actorUserId ?? null,
        workspaceId: entry.workspaceId ?? null,
        action: entry.action,
        result: entry.result as AuditResult,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        metadata: sanitizedMeta,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ? entry.userAgent.slice(0, 512) : null,
      });

      await repo.save(log);
    } catch (error) {
      // Swallowed by design: auditing must never break caller workflows
      this.logger.error(
        `Failed to record audit log for action: ${entry.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Extracts client IP (respecting proxy) and User-Agent from Express request.
   */
  fromRequest(req: Request): { ipAddress: string; userAgent: string } {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : req.ip) ||
      req.socket?.remoteAddress ||
      '';

    const userAgent = (req.headers['user-agent'] as string) || '';

    return {
      ipAddress: ip.slice(0, 45),
      userAgent: userAgent.slice(0, 512),
    };
  }

  /**
   * Sanitizes metadata: removes sensitive keys recursively and truncates long strings.
   */
  sanitizeMetadata(
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    return this.sanitizeValue(metadata) as Record<string, unknown>;
  }

  private sanitizeValue(val: unknown): unknown {
    if (val === null || val === undefined) {
      return val;
    }

    if (typeof val === 'string') {
      return val.length > MAX_METADATA_STRING_LENGTH
        ? val.slice(0, MAX_METADATA_STRING_LENGTH)
        : val;
    }

    if (Array.isArray(val)) {
      return val.map((item) => this.sanitizeValue(item));
    }

    if (typeof val === 'object') {
      const sanitizedObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (!SENSITIVE_KEY_REGEX.test(k)) {
          sanitizedObj[k] = this.sanitizeValue(v);
        }
      }
      return sanitizedObj;
    }

    return val;
  }

  async findByWorkspace(
    workspaceId: string,
    pagination?: IAuditPaginationOptions,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, pagination?.limit || DEFAULT_PAGE_LIMIT),
    );

    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findAll(
    filters?: IAuditLogFilters,
    pagination?: IAuditPaginationOptions,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, pagination?.limit || DEFAULT_PAGE_LIMIT),
    );

    const where: Record<string, unknown> = {};
    if (filters?.workspaceId) where.workspaceId = filters.workspaceId;
    if (filters?.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters?.action) where.action = filters.action;
    if (filters?.result) where.result = filters.result;

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters?.startDate) {
      where.createdAt = MoreThanOrEqual(filters.startDate);
    } else if (filters?.endDate) {
      where.createdAt = LessThanOrEqual(filters.endDate);
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
