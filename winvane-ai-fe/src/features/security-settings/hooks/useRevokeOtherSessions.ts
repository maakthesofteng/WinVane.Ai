'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { revokeOtherSessions } from '../api/securityApi';
import type {
  IRevokeOthersResponse,
  TPortal,
} from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useRevokeOtherSessions(
  portal: TPortal
): UseMutationResult<IRevokeOthersResponse, ApiError, void> {
  const queryClient = useQueryClient();

  return useMutation<IRevokeOthersResponse, ApiError, void>({
    mutationFn: () => revokeOtherSessions(portal),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.security.sessions(portal),
      });
    },
  });
}

