'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { resetPassword } from '../api/authApi';
import type {
  IResetPasswordRequest,
  IResetPasswordResponse,
} from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useResetPassword(): UseMutationResult<
  IResetPasswordResponse,
  ApiError,
  IResetPasswordRequest
> {
  return useMutation<IResetPasswordResponse, ApiError, IResetPasswordRequest>({
    mutationFn: resetPassword,
  });
}
