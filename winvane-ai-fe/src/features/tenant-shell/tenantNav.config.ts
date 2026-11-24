import { LayoutDashboard, Users, ShieldCheck, Settings, Brain } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { INavItem } from '@/components/shell';

export const TENANT_NAV_ITEMS: INavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    permission: 'dashboard:read',
    exact: true,
  },
  {
    label: 'Teams',
    href: ROUTES.TEAMS,
    icon: Users,
    permission: ['members:read', 'teams:read'],
    section: 'Teams & Permissions',
  },
  {
    label: 'Roles & Permissions',
    href: ROUTES.ROLES_PERMISSIONS,
    icon: ShieldCheck,
    permission: 'roles:read',
    section: 'Teams & Permissions',
  },
  {
    label: 'Company Brain',
    href: ROUTES.COMPANY_BRAIN,
    icon: Brain,
    permission: 'workspace:read',
    section: 'Company',
  },
  {
    label: 'Settings',
    href: ROUTES.SETTINGS_SECURITY,
    icon: Settings,
    permission: 'security:self',
    section: 'Settings',
  },
];
