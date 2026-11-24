'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useAppDispatch } from '@/store/hooks';
import { mfaChallengeStarted } from '@/store/slices/authSlice';
import { adminLogin } from '../api/adminAuthApi';
import type {
  IAdminLoginRequest,
  IAdminLoginResponse,
} from '../types/adminAuthApi.types';
import type { ApiError } from '@/lib/api/apiError';

export function useAdminLogin(): UseMutationResult<
  IAdminLoginResponse,
  ApiError,
  IAdminLoginRequest
> {
  const dispatch = useAppDispatch();

  return useMutation<IAdminLoginResponse, ApiError, IAdminLoginRequest>({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      if (
        data.status === 'mfa_required' ||
        data.status === 'mfa_setup_required'
      ) {
        dispatch(mfaChallengeStarted({ portal: 'admin' }));
      }
    },
  });
}

