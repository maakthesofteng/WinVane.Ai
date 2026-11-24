import { TSessionPortal } from '../../auth/enums/sessionPortal.enum';
import { RoleSystemKey } from '../../rbac/constants/roles.constants';

export interface IAuthContext {
  userId: string;
  sessionId: string;
  portal: TSessionPortal;
  email: string;
  fullName: string;
  role: string;
  roleSystemKey: RoleSystemKey | null;
  isCustomRole: boolean;
  isPlatformRole: boolean;
  workspaceId: string | null;
  permissions: string[];
  mfaEnabled: boolean;
}

export interface IAuthContextBase {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  roleSystemKey: RoleSystemKey | null;
  isCustomRole: boolean;
  isPlatformRole: boolean;
  workspaceId: string | null;
  workspaceStatus: string | null;
  status: string;
  permissions: string[];
  mfaEnabled: boolean;
}

export interface IJwtPayload {
  sub: string;
  sid: string;
  portal: TSessionPortal;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface ISessionRecord {
  id: string;
  userId: string;
  portal: TSessionPortal;
  jtiHash: string;
  expiresAt: string;
  lastSeenAt: string;
  revoked: boolean;
}

export interface IMfaChallengeRecord {
  id: string;
  userId: string;
  portal: TSessionPortal;
  type: 'verify' | 'setup';
  uaHash: string;
  attempts: number;
  createdAt: string;
}
