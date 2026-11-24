'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { authEvents } from '@/lib/api/authEvents';
import { getAdminCurrentUser } from '../api/adminAuthApi';
import type { IAdminCurrentUserResponse } from '../types/adminAuthApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useAdminCurrentUser(): UseQueryResult<
  IAdminCurrentUserResponse,
  ApiError
> {
  return useQuery<IAdminCurrentUserResponse, ApiError>({
    queryKey: QUERY_KEYS.admin.me(),
    queryFn: getAdminCurrentUser,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: !authEvents.getIsLoggingOut(),
  });
}

