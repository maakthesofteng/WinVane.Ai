'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { useAppDispatch } from '@/store/hooks';
import { sessionResolved } from '@/store/slices/authSlice';
import { authEvents } from '@/lib/api/authEvents';
import { clearCsrfToken } from '@/lib/api/csrf';
import { adminMfaVerify } from '../api/adminAuthApi';
import type {
  IAdminMfaVerifyRequest,
  IAdminMfaVerifyResponse,
} from '../types/adminAuthApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useAdminMfaVerify(): UseMutationResult<
  IAdminMfaVerifyResponse,
  ApiError,
  IAdminMfaVerifyRequest
> {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation<
    IAdminMfaVerifyResponse,
    ApiError,
    IAdminMfaVerifyRequest
  >({
    mutationFn: adminMfaVerify,
    onSuccess: (data) => {
      authEvents.setLoggingOut(false);
      clearCsrfToken();
      dispatch(
        sessionResolved({
          portal: 'admin',
          user: data.user,
          workspace: null,
        })
      );
      queryClient.setQueryData(QUERY_KEYS.admin.me(), {
        user: data.user,
      });
    },
  });
}

