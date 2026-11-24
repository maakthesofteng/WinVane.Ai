'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmProvider } from '@/components/common/ConfirmDialog';
import { AUTH_ROUTES, ROUTES } from '@/constants/routes';
import { authEvents } from '@/lib/api/authEvents';
import { makeQueryClient } from '@/lib/query/queryClient';
import { useAppDispatch } from '@/store/hooks';
import { sessionCleared } from '@/store/slices/authSlice';
import { StoreProvider } from '@/store/StoreProvider';

interface IProvidersProps {
  children: React.ReactNode;
}

function AuthEventListener({ queryClient }: { queryClient: ReturnType<typeof makeQueryClient> }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const unsubscribe = authEvents.subscribe(() => {
      if (authEvents.getIsLoggingOut()) {
        return;
      }
      dispatch(sessionCleared());
      queryClient.clear();

      if (pathname.startsWith('/admin')) {
        toast.error('Your admin session has ended. Please sign in again.');
        router.push(`${ROUTES.SUPERADMIN_LOGIN}?expired=1`);
        return;
      }

      const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
      if (!isAuthRoute) {
        toast.error('Your session has ended. Please sign in again.');
        const nextUrl = encodeURIComponent(pathname);
        router.push(`${ROUTES.LOGIN}?expired=1&next=${nextUrl}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch, pathname, router, queryClient]);

  return null;
}

export function Providers({ children }: IProvidersProps) {
  const [queryClient] = React.useState(() => makeQueryClient());

  return (
    <StoreProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConfirmProvider>
            <AuthEventListener queryClient={queryClient} />
            {children}
          </ConfirmProvider>
        </TooltipProvider>
        {process.env.NODE_ENV !== 'production' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </StoreProvider>
  );
}
