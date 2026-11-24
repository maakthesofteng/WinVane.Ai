import { SetMetadata } from '@nestjs/common';
import { AUTH_METADATA_KEYS } from '../constants/auth.constants';
import { TPermissionKey } from '../../rbac/constants/permissions.constants';

export const RequirePermissions = (...permissions: TPermissionKey[]) =>
  SetMetadata(AUTH_METADATA_KEYS.PERMISSIONS, permissions);

export const RequireAnyPermissions = (...permissions: TPermissionKey[]) =>
  SetMetadata(AUTH_METADATA_KEYS.ANY_PERMISSIONS, permissions);
