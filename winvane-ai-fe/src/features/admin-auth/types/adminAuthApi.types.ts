export interface IAdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SuperAdmin';
  isPlatformRole: true;
  workspaceId: null;
  permissions: string[];
  mfaEnabled: true;
}

export interface IAdminLoginRequest {
  email: string;
  password: string;
}

export interface IAdminLoginResponse {
  status: 'mfa_setup_required' | 'mfa_required';
}

export interface IAdminMfaSetupResponse {
  otpauthUrl: string;
  secret: string;
}

export interface IAdminMfaSetupConfirmRequest {
  code: string;
}

export interface IAdminMfaSetupConfirmResponse {
  status: 'authenticated';
  user: IAdminUser;
  backupCodes: string[];
}

export interface IAdminMfaVerifyRequest {
  code: string;
}

export interface IAdminMfaVerifyResponse {
  status: 'authenticated';
  user: IAdminUser;
  warning?: 'BACKUP_CODE_USED';
  backupCodesRemaining?: number;
}

export interface IAdminCurrentUserResponse {
  user: IAdminUser;
}

