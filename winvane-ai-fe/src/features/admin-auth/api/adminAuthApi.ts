import { apiGet, apiPost } from '@/lib/api/apiClient';
import type {
  IAdminCurrentUserResponse,
  IAdminLoginRequest,
  IAdminLoginResponse,
  IAdminMfaSetupConfirmRequest,
  IAdminMfaSetupConfirmResponse,
  IAdminMfaSetupResponse,
  IAdminMfaVerifyRequest,
  IAdminMfaVerifyResponse,
} from '../types/adminAuthApi.types';

export async function adminLogin(
  data: IAdminLoginRequest
): Promise<IAdminLoginResponse> {
  return apiPost<IAdminLoginResponse, IAdminLoginRequest>(
    '/admin/auth/login',
    {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    }
  );
}

export async function adminMfaSetup(): Promise<IAdminMfaSetupResponse> {
  return apiPost<IAdminMfaSetupResponse>('/admin/auth/mfa/setup');
}

export async function adminMfaSetupConfirm(
  data: IAdminMfaSetupConfirmRequest
): Promise<IAdminMfaSetupConfirmResponse> {
  return apiPost<
    IAdminMfaSetupConfirmResponse,
    IAdminMfaSetupConfirmRequest
  >('/admin/auth/mfa/setup/confirm', {
    code: data.code.trim(),
  });
}

export async function adminMfaVerify(
  data: IAdminMfaVerifyRequest
): Promise<IAdminMfaVerifyResponse> {
  return apiPost<IAdminMfaVerifyResponse, IAdminMfaVerifyRequest>(
    '/admin/auth/mfa/verify',
    {
      code: data.code.trim(),
    }
  );
}

export async function adminLogout(): Promise<void> {
  await apiPost<void>('/admin/auth/logout');
}

export async function getAdminCurrentUser(): Promise<IAdminCurrentUserResponse> {
  return apiGet<IAdminCurrentUserResponse>('/admin/auth/me');
}

