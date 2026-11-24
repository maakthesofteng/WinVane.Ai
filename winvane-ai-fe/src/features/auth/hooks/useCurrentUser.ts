'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { authEvents } from '@/lib/api/authEvents';
import { getCurrentUser } from '../api/authApi';
import type { ICurrentUserResponse } from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useCurrentUser(): UseQueryResult<ICurrentUserResponse, ApiError> {
  return useQuery<ICurrentUserResponse, ApiError>({
    queryKey: QUERY_KEYS.auth.me(),
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: !authEvents.getIsLoggingOut(),
  });
}
