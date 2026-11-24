'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { forgotPassword } from '../api/authApi';
import type {
  IForgotPasswordRequest,
  IForgotPasswordResponse,
} from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useForgotPassword(): UseMutationResult<
  IForgotPasswordResponse,
  ApiError,
  IForgotPasswordRequest
> {
  return useMutation<IForgotPasswordResponse, ApiError, IForgotPasswordRequest>({
    mutationFn: forgotPassword,
  });
}
