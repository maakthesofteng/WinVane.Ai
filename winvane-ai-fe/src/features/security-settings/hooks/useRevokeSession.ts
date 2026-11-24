'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { revokeSession } from '../api/securityApi';
import type { ISessionView, TPortal } from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

interface IRevokeContext {
  previous?: ISessionView[];
}

export function useRevokeSession(
  portal: TPortal
): UseMutationResult<void, ApiError, string, IRevokeContext> {
  const queryClient = useQueryClient();
  const sessionsKey = QUERY_KEYS.security.sessions(portal);

  return useMutation<void, ApiError, string, IRevokeContext>({
    mutationFn: (sessionId: string) => revokeSession(portal, sessionId),
    onMutate: async (sessionId: string) => {
      await queryClient.cancelQueries({ queryKey: sessionsKey });
      const previous = queryClient.getQueryData<ISessionView[]>(sessionsKey);
      if (previous) {
        queryClient.setQueryData<ISessionView[]>(
          sessionsKey,
          previous.filter((s) => s.id !== sessionId)
        );
      }
      return { previous };
    },
    onError: (_error, _sessionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(sessionsKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKey });
    },
  });
}

