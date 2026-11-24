import { apiDelete, apiGet, apiPost } from '@/lib/api/apiClient';
import type {
  IBackupCodesResponse,
  IChangePasswordPayload,
  IDisableMfaPayload,
  IEnableMfaPayload,
  IMfaStatusResponse,
  IMfaSetupResponse,
  IRegenerateBackupCodesPayload,
  IRevokeOthersResponse,
  ISessionView,
  IStepUpPayload,
  TPortal,
} from '../types/securityApi.types';

function getBasePath(portal: TPortal): string {
  return portal === 'admin' ? '/admin/account/security' : '/account/security';
}

export async function getMfaStatus(portal: TPortal): Promise<IMfaStatusResponse> {
  return apiGet<IMfaStatusResponse>(`${getBasePath(portal)}/mfa`);
}

export async function beginMfaSetup(
  portal: TPortal,
  data: IStepUpPayload
): Promise<IMfaSetupResponse> {
  return apiPost<IMfaSetupResponse, IStepUpPayload>(
    `${getBasePath(portal)}/mfa/setup`,
    data
  );
}

export async function enableMfa(
  portal: TPortal,
  data: IEnableMfaPayload
): Promise<IBackupCodesResponse> {
  return apiPost<IBackupCodesResponse, IEnableMfaPayload>(
    `${getBasePath(portal)}/mfa/enable`,
    data
  );
}

export async function disableMfa(
  portal: TPortal,
  data: IDisableMfaPayload
): Promise<void> {
  return apiPost<void, IDisableMfaPayload>(
    `${getBasePath(portal)}/mfa/disable`,
    data
  );
}

export async function regenerateBackupCodes(
  portal: TPortal,
  data: IRegenerateBackupCodesPayload
): Promise<IBackupCodesResponse> {
  return apiPost<IBackupCodesResponse, IRegenerateBackupCodesPayload>(
    `${getBasePath(portal)}/mfa/backup-codes/regenerate`,
    data
  );
}

export async function getSessions(portal: TPortal): Promise<ISessionView[]> {
  return apiGet<ISessionView[]>(`${getBasePath(portal)}/sessions`);
}

export async function revokeSession(
  portal: TPortal,
  sessionId: string
): Promise<void> {
  return apiDelete<void>(`${getBasePath(portal)}/sessions/${sessionId}`);
}

export async function revokeOtherSessions(
  portal: TPortal
): Promise<IRevokeOthersResponse> {
  return apiPost<IRevokeOthersResponse>(
    `${getBasePath(portal)}/sessions/revoke-others`
  );
}

export async function changePassword(
  portal: TPortal,
  data: IChangePasswordPayload
): Promise<void> {
  return apiPost<void, IChangePasswordPayload>(
    `${getBasePath(portal)}/password`,
    data
  );
}

