'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { verifyEmail } from '../api/authApi';
import type { IVerifyEmailRequest, IVerifyEmailResponse } from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useVerifyEmail(): UseMutationResult<
  IVerifyEmailResponse,
  ApiError,
  IVerifyEmailRequest
> {
  return useMutation<IVerifyEmailResponse, ApiError, IVerifyEmailRequest>({
    mutationFn: verifyEmail,
  });
}
