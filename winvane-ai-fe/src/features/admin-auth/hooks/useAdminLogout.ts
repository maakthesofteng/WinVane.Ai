'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { useAppDispatch } from '@/store/hooks';
import { sessionCleared } from '@/store/slices/authSlice';
import { adminLogout } from '../api/adminAuthApi';
import type { ApiError } from '@/lib/api/apiError';
import { authEvents } from '@/lib/api/authEvents';
import { clearCsrfToken } from '@/lib/api/csrf';

export function useAdminLogout(): UseMutationResult<void, ApiError, void> {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const cleanupSession = () => {
    authEvents.setLoggingOut(true);
    void queryClient.cancelQueries();
    clearCsrfToken();
    dispatch(sessionCleared());
    queryClient.clear();
    router.push(ROUTES.SUPERADMIN_LOGIN);
  };

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      authEvents.setLoggingOut(true);
      await adminLogout();
    },
    onSuccess: () => {
      cleanupSession();
    },
    onError: () => {
      cleanupSession();
    },
  });
}
