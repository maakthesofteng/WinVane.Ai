import type { Metadata } from 'next';
import { AdminLoginForm } from '@/features/admin-auth';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to access your platform account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuperAdminLoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Platform sign-in
        </h1>
        <p className="text-xs text-muted-foreground">
          Enter your platform credentials to continue.
        </p>
      </div>

      <AdminLoginForm />
    </div>
  );
}

