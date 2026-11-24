'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { useAppDispatch } from '@/store/hooks';
import { mfaChallengeStarted, sessionResolved } from '@/store/slices/authSlice';
import { authEvents } from '@/lib/api/authEvents';
import { clearCsrfToken } from '@/lib/api/csrf';
import { loginUser } from '../api/authApi';
import type { ILoginRequest, TLoginResponse } from '../types/authApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useLogin(): UseMutationResult<TLoginResponse, ApiError, ILoginRequest> {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation<TLoginResponse, ApiError, ILoginRequest>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (data.status === 'authenticated') {
        authEvents.setLoggingOut(false);
        clearCsrfToken();
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
      } else if (data.status === 'mfa_required') {
        dispatch(mfaChallengeStarted({ portal: 'tenant' }));
      }
    },
  });
}
