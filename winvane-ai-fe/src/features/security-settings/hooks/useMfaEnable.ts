'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { enableMfa } from '../api/securityApi';
import type {
  IBackupCodesResponse,
  IEnableMfaPayload,
  TPortal,
} from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useMfaEnable(
  portal: TPortal
): UseMutationResult<IBackupCodesResponse, ApiError, IEnableMfaPayload> {
  const queryClient = useQueryClient();

  return useMutation<IBackupCodesResponse, ApiError, IEnableMfaPayload>({
    mutationFn: (data: IEnableMfaPayload) => enableMfa(portal, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.security.mfa(portal),
      });
      const meKey =
        portal === 'admin' ? QUERY_KEYS.admin.me() : QUERY_KEYS.auth.me();
      queryClient.invalidateQueries({ queryKey: meKey });
    },
  });
}

