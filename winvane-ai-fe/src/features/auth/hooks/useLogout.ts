'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { useAppDispatch } from '@/store/hooks';
import { sessionCleared } from '@/store/slices/authSlice';
import { logoutUser } from '../api/authApi';
import type { ApiError } from '@/lib/api/apiError';
import { authEvents } from '@/lib/api/authEvents';
import { clearCsrfToken } from '@/lib/api/csrf';

export function useLogout(): UseMutationResult<void, ApiError, void> {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const cleanupSession = () => {
    authEvents.setLoggingOut(true);
    void queryClient.cancelQueries();
    clearCsrfToken();
    dispatch(sessionCleared());
    queryClient.clear();
    router.replace(ROUTES.LOGIN);
  };

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      authEvents.setLoggingOut(true);
      await logoutUser();
    },
    onSuccess: () => {
      cleanupSession();
    },
    onError: () => {
      // Clear client state even if network request fails
      cleanupSession();
    },
  });
}
