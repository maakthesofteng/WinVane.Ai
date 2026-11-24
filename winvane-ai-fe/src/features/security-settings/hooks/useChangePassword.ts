'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { changePassword } from '../api/securityApi';
import type {
  IChangePasswordPayload,
  TPortal,
} from '../types/securityApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useChangePassword(
  portal: TPortal
): UseMutationResult<void, ApiError, IChangePasswordPayload> {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, IChangePasswordPayload>({
    mutationFn: (data: IChangePasswordPayload) => changePassword(portal, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.security.sessions(portal),
      });
    },
  });
}

