import type { LucideIcon } from 'lucide-react';

export interface INavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string | string[];
  badge?: string;
  exact?: boolean;
  section?: string;
}
