import { Gauge, Building2, ScrollText, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { INavItem } from '@/components/shell';

export const ADMIN_NAV_ITEMS: INavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.ADMIN_DASHBOARD,
    icon: Gauge,
    permission: 'admin:stats:read',
    exact: true,
  },
  {
    label: 'Tenants',
    href: ROUTES.ADMIN_TENANTS,
    icon: Building2,
    permission: 'admin:tenants:read',
  },
  {
    label: 'Audit log',
    href: ROUTES.ADMIN_AUDIT_LOG,
    icon: ScrollText,
    permission: 'admin:audit:read',
  },
  {
    label: 'Security',
    href: ROUTES.ADMIN_SECURITY,
    icon: ShieldCheck,
    permission: 'security:self',
  },
];

