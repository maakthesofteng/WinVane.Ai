export type TPortal = 'tenant' | 'admin';

export interface IMfaStatusResponse {
  enabled: boolean;
  confirmedAt: string | null;
  backupCodesRemaining: number;
  canDisable: boolean;
}

export interface IMfaSetupResponse {
  otpauthUrl: string;
  secret: string;
}

export interface IBackupCodesResponse {
  backupCodes: string[];
}

export interface ISessionView {
  id: string;
  current: boolean;
  ipAddress: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export interface IRevokeOthersResponse {
  revokedCount: number;
}

export interface IStepUpPayload {
  currentPassword: string;
}

export interface IEnableMfaPayload {
  code: string;
}

export interface IDisableMfaPayload {
  currentPassword: string;
  code: string;
}

export interface IRegenerateBackupCodesPayload {
  code: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

