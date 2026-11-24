'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useAdminCurrentUser } from '@/features/admin-auth/hooks/useAdminCurrentUser';
import { useAdminLogout } from '@/features/admin-auth/hooks/useAdminLogout';
import { sessionResolved, sessionCleared, selectCurrentUser } from '@/store/slices/authSlice';
import { FullPageSpinner } from '@/components/common/FullPageSpinner';
import { ROUTES } from '@/constants/routes';
import { authEvents } from '@/lib/api/authEvents';

export interface IAdminSessionGateProps {
  children: React.ReactNode;
}

export function AdminSessionGate({ children }: IAdminSessionGateProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { data, isLoading, isError, error } = useAdminCurrentUser();
  const adminLogoutMutation = useAdminLogout();

  React.useEffect(() => {
    if (isLoading || authEvents.getIsLoggingOut()) return;

    if (isError || !data) {
      const isExpired = !authEvents.getIsLoggingOut() && error?.statusCode === 401;
      const destination = isExpired
        ? `${ROUTES.SUPERADMIN_LOGIN}?expired=1`
        : ROUTES.SUPERADMIN_LOGIN;
      dispatch(sessionCleared());
      router.replace(destination);
      return;
    }

    // Non-platform user detected in superadmin portal
    if (!data.user.isPlatformRole && data.user.role !== 'SuperAdmin') {
      adminLogoutMutation.mutate(undefined, {
        onSettled: () => {
          dispatch(sessionCleared());
          router.replace(ROUTES.SUPERADMIN_LOGIN);
        },
      });
      return;
    }

    dispatch(
      sessionResolved({
        portal: 'admin',
        user: data.user,
        workspace: null,
      })
    );
  }, [isLoading, isError, data, error, dispatch, router, adminLogoutMutation]);

  if (isLoading || !currentUser || (!currentUser.isPlatformRole && currentUser.role !== 'SuperAdmin')) {
    return <FullPageSpinner message="Loading admin session..." className="min-h-screen" />;
  }

  return <>{children}</>;
}
