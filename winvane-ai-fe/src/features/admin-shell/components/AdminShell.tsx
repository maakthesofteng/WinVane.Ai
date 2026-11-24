'use client';

import * as React from 'react';
import { AppShell, Sidebar, Topbar, MobileNav, UserMenu, PortalBadge } from '@/components/shell';
import { useAdminLogout } from '@/features/admin-auth/hooks/useAdminLogout';
import { ROUTES } from '@/constants/routes';
import { ADMIN_NAV_ITEMS } from '../adminNav.config';

export interface IAdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: IAdminShellProps) {
  const adminLogoutMutation = useAdminLogout();

  const leftSlot = (
    <div className="flex items-center gap-2.5">
      <PortalBadge />
    </div>
  );

  const rightSlot = (
    <UserMenu
      securityHref={ROUTES.ADMIN_SECURITY}
      loginHref={ROUTES.SUPERADMIN_LOGIN}
      onLogoutMutation={() => adminLogoutMutation.mutateAsync()}
    />
  );

  const mobileNav = (
    <MobileNav
      items={ADMIN_NAV_ITEMS}
      homeHref={ROUTES.ADMIN_DASHBOARD}
      headerSlot={<PortalBadge />}
    />
  );

  const sidebar = (
    <Sidebar
      items={ADMIN_NAV_ITEMS}
      homeHref={ROUTES.ADMIN_DASHBOARD}
      headerSlot={<PortalBadge />}
    />
  );

  const topbar = (
    <Topbar
      leftSlot={leftSlot}
      rightSlot={rightSlot}
      mobileNav={mobileNav}
      showAdminBorder={true}
    />
  );

  return (
    <AppShell sidebar={sidebar} topbar={topbar}>
      {children}
    </AppShell>
  );
}

