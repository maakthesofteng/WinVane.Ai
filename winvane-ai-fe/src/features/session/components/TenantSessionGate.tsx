'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { sessionResolved, sessionCleared, selectCurrentUser } from '@/store/slices/authSlice';
import { FullPageSpinner } from '@/components/common/FullPageSpinner';
import { ROUTES } from '@/constants/routes';
import { authEvents } from '@/lib/api/authEvents';

export interface ITenantSessionGateProps {
  children: React.ReactNode;
}

export function TenantSessionGate({ children }: ITenantSessionGateProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { data, isLoading, isError, error } = useCurrentUser();
  const logoutMutation = useLogout();

  React.useEffect(() => {
    if (isLoading || authEvents.getIsLoggingOut()) return;

    if (isError || !data) {
      const isExpired = !authEvents.getIsLoggingOut() && error?.statusCode === 401;
      const destination = isExpired ? `${ROUTES.LOGIN}?expired=1` : ROUTES.LOGIN;
      dispatch(sessionCleared());
      router.replace(destination);
      return;
    }

    // Platform administrator detected in tenant portal
    if (data.user.isPlatformRole) {
      logoutMutation.mutate(undefined, {
        onSettled: () => {
          dispatch(sessionCleared());
          router.replace(ROUTES.LOGIN);
        },
      });
      return;
    }

    dispatch(
      sessionResolved({
        portal: 'tenant',
        user: data.user,
        workspace: data.workspace,
      })
    );
  }, [isLoading, isError, data, error, dispatch, router, logoutMutation]);

  if (isLoading || !currentUser || currentUser.isPlatformRole) {
    return <FullPageSpinner message="Loading workspace..." className="min-h-screen" />;
  }

  return <>{children}</>;
}
