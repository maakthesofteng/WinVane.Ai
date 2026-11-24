'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { AppShell, Sidebar, Topbar, MobileNav, UserMenu } from '@/components/shell';
import { Badge } from '@/components/ui/badge';
import { selectWorkspace } from '@/store/slices/authSlice';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { ROUTES } from '@/constants/routes';
import { TENANT_NAV_ITEMS } from '../tenantNav.config';

export interface ITenantShellProps {
  children: React.ReactNode;
}

export function TenantShell({ children }: ITenantShellProps) {
  const workspace = useSelector(selectWorkspace);
  const logoutMutation = useLogout();

  const leftSlot = (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-semibold text-foreground max-w-[180px] sm:max-w-[260px] truncate">
        {workspace?.name ?? 'Workspace'}
      </span>
      <Badge
        variant="outline"
        className="border-primary/40 bg-primary/10 text-primary text-[10px] font-medium uppercase tracking-wider"
      >
        {workspace?.planTier ?? 'Pilot'}
      </Badge>
    </div>
  );

  const rightSlot = (
    <UserMenu
      securityHref={ROUTES.SETTINGS_SECURITY}
      loginHref={ROUTES.LOGIN}
      onLogoutMutation={() => logoutMutation.mutateAsync()}
    />
  );

  const mobileNav = (
    <MobileNav
      items={TENANT_NAV_ITEMS}
      homeHref={ROUTES.DASHBOARD}
    />
  );

  const sidebar = (
    <Sidebar
      items={TENANT_NAV_ITEMS}
      homeHref={ROUTES.DASHBOARD}
    />
  );

  const topbar = (
    <Topbar
      leftSlot={leftSlot}
      rightSlot={rightSlot}
      mobileNav={mobileNav}
    />
  );

  return (
    <AppShell sidebar={sidebar} topbar={topbar}>
      {children}
    </AppShell>
  );
}
