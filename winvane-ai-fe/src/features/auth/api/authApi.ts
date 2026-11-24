import { apiGet, apiPost } from '@/lib/api/apiClient';
import type {
  ICurrentUserResponse,
  IForgotPasswordRequest,
  IForgotPasswordResponse,
  ILoginRequest,
  IMfaVerifyRequest,
  IMfaVerifyResponse,
  IRegisterRequest,
  IRegisterResponse,
  IResendVerificationRequest,
  IResendVerificationResponse,
  IResetPasswordRequest,
  IResetPasswordResponse,
  IVerifyEmailRequest,
  IVerifyEmailResponse,
  TLoginResponse,
} from '../types/authApi.types';

export async function registerUser(data: IRegisterRequest): Promise<IRegisterResponse> {
  return apiPost<IRegisterResponse, IRegisterRequest>('/auth/register', {
    companyName: data.companyName.trim(),
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
  });
}

export async function verifyEmail(data: IVerifyEmailRequest): Promise<IVerifyEmailResponse> {
  return apiPost<IVerifyEmailResponse, IVerifyEmailRequest>('/auth/verify-email', {
    token: data.token.trim(),
  });
}

export async function resendVerification(
  data: IResendVerificationRequest
): Promise<IResendVerificationResponse> {
  return apiPost<IResendVerificationResponse, IResendVerificationRequest>(
    '/auth/resend-verification',
    {
      email: data.email.trim().toLowerCase(),
    }
  );
}

export async function loginUser(data: ILoginRequest): Promise<TLoginResponse> {
  return apiPost<TLoginResponse, ILoginRequest>('/auth/login', {
    email: data.email.trim().toLowerCase(),
    password: data.password,
  });
}

export async function verifyMfa(data: IMfaVerifyRequest): Promise<IMfaVerifyResponse> {
  return apiPost<IMfaVerifyResponse, IMfaVerifyRequest>('/auth/mfa/verify', {
    code: data.code.trim(),
  });
}

export async function logoutUser(): Promise<void> {
  await apiPost<void>('/auth/logout');
}

export async function getCurrentUser(): Promise<ICurrentUserResponse> {
  return apiGet<ICurrentUserResponse>('/auth/me');
}

export async function forgotPassword(
  data: IForgotPasswordRequest
): Promise<IForgotPasswordResponse> {
  return apiPost<IForgotPasswordResponse, IForgotPasswordRequest>('/auth/forgot-password', {
    email: data.email.trim().toLowerCase(),
  });
}

export async function resetPassword(
  data: IResetPasswordRequest
): Promise<IResetPasswordResponse> {
  return apiPost<IResetPasswordResponse, IResetPasswordRequest>('/auth/reset-password', {
    token: data.token.trim(),
    newPassword: data.newPassword,
  });
}

