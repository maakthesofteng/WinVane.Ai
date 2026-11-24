'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { useAppDispatch } from '@/store/hooks';
import { sessionResolved } from '@/store/slices/authSlice';
import { verifyMfa } from '../api/authApi';
import type { IMfaVerifyRequest, IMfaVerifyResponse } from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useMfaVerify(): UseMutationResult<
  IMfaVerifyResponse,
  ApiError,
  IMfaVerifyRequest
> {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation<IMfaVerifyResponse, ApiError, IMfaVerifyRequest>({
    mutationFn: verifyMfa,
    onSuccess: (data) => {
      dispatch(
        sessionResolved({
          portal: 'tenant',
          user: data.user,
          workspace: data.workspace,
        })
      );
      queryClient.setQueryData(QUERY_KEYS.auth.me(), {
        user: data.user,
        workspace: data.workspace,
      });
    },
  });
}
