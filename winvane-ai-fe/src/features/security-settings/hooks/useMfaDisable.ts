'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { disableMfa } from '../api/securityApi';
import type { IDisableMfaPayload, TPortal } from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useMfaDisable(
  portal: TPortal
): UseMutationResult<void, ApiError, IDisableMfaPayload> {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, IDisableMfaPayload>({
    mutationFn: (data: IDisableMfaPayload) => disableMfa(portal, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.security.mfa(portal),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.security.sessions(portal),
      });
      const meKey =
        portal === 'admin' ? QUERY_KEYS.admin.me() : QUERY_KEYS.auth.me();
      queryClient.invalidateQueries({ queryKey: meKey });
    },
  });
}

