import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AUTH_METADATA_KEYS } from '../constants/auth.constants';
import { IAuthContext } from '../interfaces/authContext.interface';
import { TPermissionKey } from '../../rbac/constants/permissions.constants';
import { AuditLogService } from '../../audit/auditLog.service';
import { AUDIT_ACTIONS } from '../../audit/constants/auditActions.constants';
import { AuditResult } from '../../audit/enums/auditResult.enum';
import { ERROR_CODES } from '../../../common/constants/errorCodes.constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      AUTH_METADATA_KEYS.IS_PUBLIC,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<
      TPermissionKey[]
    >(AUTH_METADATA_KEYS.PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredAnyPermissions = this.reflector.getAllAndOverride<
      TPermissionKey[]
    >(AUTH_METADATA_KEYS.ANY_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);

    const hasAllCheck = requiredPermissions && requiredPermissions.length > 0;
    const hasAnyCheck =
      requiredAnyPermissions && requiredAnyPermissions.length > 0;

    if (!hasAllCheck && !hasAnyCheck) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: IAuthContext }>();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException({
        message: 'Authentication required.',
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    const userPermissions = user.permissions || [];

    if (hasAllCheck) {
      const missingPermissions = requiredPermissions.filter(
        (perm) => !userPermissions.includes(perm),
      );

      if (missingPermissions.length > 0) {
        await this.handleAccessDenied(
          request,
          user,
          requiredPermissions,
          missingPermissions,
        );
      }
    }

    if (hasAnyCheck) {
      const hasAny = requiredAnyPermissions.some((perm) =>
        userPermissions.includes(perm),
      );

      if (!hasAny) {
        await this.handleAccessDenied(
          request,
          user,
          requiredAnyPermissions,
          requiredAnyPermissions,
        );
      }
    }

    return true;
  }

  private async handleAccessDenied(
    request: Request,
    user: IAuthContext,
    required: TPermissionKey[],
    missing: TPermissionKey[],
  ): Promise<never> {
    const route = request.originalUrl || request.url;

    await this.auditLogService.record({
      action: AUDIT_ACTIONS.RBAC_DENIED,
      result: AuditResult.DENIED,
      actorUserId: user.userId,
      workspaceId: user.workspaceId,
      targetType: 'route',
      targetId: route,
      metadata: {
        required,
        missing,
        route,
      },
    });

    throw new ForbiddenException({
      message: 'Access denied: insufficient permissions.',
      code: ERROR_CODES.FORBIDDEN,
    });
  }
}
