export type TRoleName = 'SuperAdmin' | 'Owner' | 'Admin' | 'Manager' | 'Member' | (string & {});

export type TAuthStatus =
  | 'unknown'
  | 'authenticated'
  | 'unauthenticated'
  | 'mfa_required';

export type TPortalType = 'tenant' | 'admin' | null;

export interface IAuthUser {
  id: string;
  email: string;
  fullName: string;
  role: TRoleName;
  isPlatformRole: boolean;
  workspaceId: string | null;
  permissions: string[];
  mfaEnabled: boolean;
}

export interface IWorkspaceSummary {
  id: string;
  name: string;
  domain: string;
  status: string;
  planTier: 'free' | 'pilot' | 'pro';
}

export interface IAuthState {
  status: TAuthStatus;
  portal: TPortalType;
  user: IAuthUser | null;
  workspace: IWorkspaceSummary | null;
}
