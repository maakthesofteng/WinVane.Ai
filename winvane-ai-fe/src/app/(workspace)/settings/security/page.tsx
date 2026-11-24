import type { Metadata } from 'next';
import { SecuritySettingsPage } from '@/features/security-settings';

export const metadata: Metadata = {
  title: 'Security Settings — WinVane.ai',
};

export default function TenantSecurityPage() {
  return <SecuritySettingsPage portal="tenant" />;
}

