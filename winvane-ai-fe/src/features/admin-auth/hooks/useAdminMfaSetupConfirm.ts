'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { adminMfaSetupConfirm } from '../api/adminAuthApi';
import type {
  IAdminMfaSetupConfirmRequest,
  IAdminMfaSetupConfirmResponse,
} from '../types/adminAuthApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useAdminMfaSetupConfirm(): UseMutationResult<
  IAdminMfaSetupConfirmResponse,
  ApiError,
  IAdminMfaSetupConfirmRequest
> {
  return useMutation<
    IAdminMfaSetupConfirmResponse,
    ApiError,
    IAdminMfaSetupConfirmRequest
  >({
    mutationFn: adminMfaSetupConfirm,
  });
}

