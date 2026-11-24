'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { adminMfaSetup } from '../api/adminAuthApi';
import type { IAdminMfaSetupResponse } from '../types/adminAuthApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useAdminMfaSetup(): UseMutationResult<
  IAdminMfaSetupResponse,
  ApiError,
  void
> {
  return useMutation<IAdminMfaSetupResponse, ApiError, void>({
    mutationFn: adminMfaSetup,
  });
}

