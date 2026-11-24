'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { regenerateBackupCodes } from '../api/securityApi';
import type {
  IBackupCodesResponse,
  IRegenerateBackupCodesPayload,
  TPortal,
} from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useRegenerateBackupCodes(
  portal: TPortal
): UseMutationResult<
  IBackupCodesResponse,
  ApiError,
  IRegenerateBackupCodesPayload
> {
  const queryClient = useQueryClient();

  return useMutation<
    IBackupCodesResponse,
    ApiError,
    IRegenerateBackupCodesPayload
  >({
    mutationFn: (data: IRegenerateBackupCodesPayload) =>
      regenerateBackupCodes(portal, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.security.mfa(portal),
      });
    },
  });
}

