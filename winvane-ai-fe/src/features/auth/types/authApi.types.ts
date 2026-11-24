import type { IAuthUser, IWorkspaceSummary } from '@/types/auth.types';

export interface IRegisterRequest {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
}

export interface IRegisterResponse {
  message: string;
}

export interface IVerifyEmailRequest {
  token: string;
}

export interface IVerifyEmailResponse {
  message: string;
  redirectTo?: string;
}

export interface IResendVerificationRequest {
  email: string;
}

export interface IResendVerificationResponse {
  message: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginSuccessResponse {
  status: 'authenticated';
  user: IAuthUser;
  workspace: IWorkspaceSummary | null;
}

export interface ILoginMfaResponse {
  status: 'mfa_required';
}

export type TLoginResponse = ILoginSuccessResponse | ILoginMfaResponse;

export interface IMfaVerifyRequest {
  code: string;
}

export interface IMfaVerifyResponse {
  status: 'authenticated';
  user: IAuthUser;
  workspace: IWorkspaceSummary | null;
  warning?: 'BACKUP_CODE_USED';
  backupCodesRemaining?: number;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IForgotPasswordResponse {
  message: string;
}

export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface IResetPasswordResponse {
  message: string;
  redirectTo?: string;
}

export interface ICurrentUserResponse {
  user: IAuthUser;
  workspace: IWorkspaceSummary | null;
}

