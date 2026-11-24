'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { resendVerification } from '../api/authApi';
import type {
  IResendVerificationRequest,
  IResendVerificationResponse,
} from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useResendVerification(): UseMutationResult<
  IResendVerificationResponse,
  ApiError,
  IResendVerificationRequest
> {
  return useMutation<IResendVerificationResponse, ApiError, IResendVerificationRequest>({
    mutationFn: resendVerification,
  });
}
