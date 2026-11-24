import type { Metadata } from 'next';
import { AdminDashboardContent } from '@/features/admin-auth';

export const metadata: Metadata = {
  title: 'Platform Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
