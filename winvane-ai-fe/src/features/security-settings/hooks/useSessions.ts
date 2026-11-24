'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { getSessions } from '../api/securityApi';
import type { ISessionView, TPortal } from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useSessions(
  portal: TPortal
): UseQueryResult<ISessionView[], ApiError> {
  return useQuery<ISessionView[], ApiError>({
    queryKey: QUERY_KEYS.security.sessions(portal),
    queryFn: () => getSessions(portal),
    staleTime: 30 * 1000,
  });
}

