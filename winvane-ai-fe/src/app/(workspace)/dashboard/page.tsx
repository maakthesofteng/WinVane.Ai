import type { Metadata } from 'next';
import { TenantDashboardContent } from '@/features/tenant-shell';

export const metadata: Metadata = {
  title: 'Dashboard — WinVane.ai',
};

export default function DashboardPage() {
  return <TenantDashboardContent />;
}
