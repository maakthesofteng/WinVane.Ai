'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { getMfaStatus } from '../api/securityApi';
import type { IMfaStatusResponse, TPortal } from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useMfaStatus(
  portal: TPortal
): UseQueryResult<IMfaStatusResponse, ApiError> {
  return useQuery<IMfaStatusResponse, ApiError>({
    queryKey: QUERY_KEYS.security.mfa(portal),
    queryFn: () => getMfaStatus(portal),
    staleTime: 60 * 1000,
  });
}

