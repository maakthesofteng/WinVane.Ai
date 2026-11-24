import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Permission } from '../../rbac/entities/permission.entity';
import {
  ROLE_NAMES,
  RoleSystemKey,
} from '../../rbac/constants/roles.constants';
import { RedisService } from '../../redis/redis.service';
import { AUTH_CACHE_KEYS } from '../constants/auth.constants';
import { IAuthContextBase } from '../interfaces/authContext.interface';

const AUTH_CONTEXT_CACHE_TTL_SECONDS = 300;

@Injectable()
export class AuthContextService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly redisService: RedisService,
  ) {}

  private async getCatalogVersion(): Promise<string> {
    const version = await this.redisService.get<string>(
      AUTH_CACHE_KEYS.PERMISSION_CATALOG_VERSION,
    );
    return version ? String(version) : '1';
  }

  private async buildCacheKey(userId: string): Promise<string> {
    const version = await this.getCatalogVersion();
    return `${AUTH_CACHE_KEYS.AUTH_CONTEXT_PREFIX}v${version}:${userId}`;
  }

  async load(userId: string): Promise<IAuthContextBase | null> {
    if (!userId) {
      return null;
    }

    const cacheKey = await this.buildCacheKey(userId);
    const cached = await this.redisService.get<IAuthContextBase | string>(
      cacheKey,
    );

    if (cached) {
      if (typeof cached === 'object' && cached !== null) {
        return cached;
      }
      try {
        return JSON.parse(cached) as IAuthContextBase;
      } catch {
        // Fallback to database
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
        workspace: true,
      },
    });

    if (!user || !user.role) {
      return null;
    }

    let permissions: string[];
    const isOwner =
      user.role.systemKey === RoleSystemKey.OWNER ||
      user.role.name === ROLE_NAMES.OWNER;

    if (isOwner) {
      // Owner dynamically gets every non-platform tenant permission
      const allTenantPerms = await this.permissionRepository.find({
        where: { isPlatform: false },
        select: { key: true },
      });
      permissions = allTenantPerms.map((p) => p.key);
    } else {
      permissions = (user.role.rolePermissions || [])
        .map((rp) => rp.permission?.key)
        .filter((k): k is string => Boolean(k));
    }

    const isSystemRole = Boolean(user.role.isSystem || user.role.systemKey);
    const authContext: IAuthContextBase = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      roleSystemKey:
        user.role.systemKey ?? (isOwner ? RoleSystemKey.OWNER : null),
      isCustomRole: !isSystemRole,
      isPlatformRole: user.role.isPlatformRole,
      workspaceId: user.workspaceId,
      workspaceStatus: user.workspace?.status ?? null,
      status: user.status,
      permissions,
      mfaEnabled: user.mfaEnabled,
    };

    await this.redisService.set(
      cacheKey,
      JSON.stringify(authContext),
      AUTH_CONTEXT_CACHE_TTL_SECONDS,
    );

    return authContext;
  }

  async invalidate(userId: string): Promise<void> {
    const cacheKey = await this.buildCacheKey(userId);
    await this.redisService.del(cacheKey);
  }

  async invalidateUserContext(userId: string): Promise<void> {
    await this.invalidate(userId);
  }

  async invalidateByRole(roleId: string): Promise<void> {
    const users = await this.userRepository.find({
      where: { roleId },
      select: { id: true },
    });

    for (const u of users) {
      await this.invalidate(u.id);
    }
  }

  async bumpCatalogVersion(): Promise<void> {
    const key = AUTH_CACHE_KEYS.PERMISSION_CATALOG_VERSION;
    const current = await this.redisService.get<string>(key);
    const next = current ? parseInt(String(current), 10) + 1 : 2;
    await this.redisService.set(key, String(next));
  }
}
