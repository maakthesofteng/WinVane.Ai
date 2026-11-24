export interface IAuthUserDto {
  id: string;
  email: string;
  fullName: string;
  role: 'Owner' | 'Admin' | 'Member';
  isPlatformRole: false;
  workspaceId: string;
  permissions: string[];
  mfaEnabled: boolean;
}

export interface IWorkspaceSummaryDto {
  id: string;
  name: string;
  domain: string;
  status: 'active';
  planTier: 'free' | 'pilot' | 'pro';
}

export interface IGenericMessageResponse {
  message: string;
}

export interface IRedirectMessageResponse {
  message: string;
  redirectTo: string;
}

export interface IAuthLoginSuccessResponse {
  status: 'authenticated';
  user: IAuthUserDto;
  workspace: IWorkspaceSummaryDto;
  warning?: string;
  backupCodesRemaining?: number;
}

export interface IAuthLoginMfaRequiredResponse {
  status: 'mfa_required';
}

export type TAuthLoginResponse =
  IAuthLoginSuccessResponse | IAuthLoginMfaRequiredResponse;

export interface IAuthMeResponse {
  user: IAuthUserDto;
  workspace: IWorkspaceSummaryDto;
}
