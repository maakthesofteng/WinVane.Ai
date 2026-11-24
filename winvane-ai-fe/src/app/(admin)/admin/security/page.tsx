import type { Metadata } from 'next';
import { SecuritySettingsPage } from '@/features/security-settings';

export const metadata: Metadata = {
  title: 'Platform Security — Platform Admin',
};

export default function AdminSecurityPage() {
  return <SecuritySettingsPage portal="admin" />;
}

