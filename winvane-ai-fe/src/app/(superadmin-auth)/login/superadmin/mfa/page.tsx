import type { Metadata } from 'next';
import { SuperAdminMfaForm } from '@/features/admin-auth';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuperAdminMfaPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Two-factor authentication
        </h1>
        <p className="text-xs text-muted-foreground">
          Enter the verification code from your authenticator app.
        </p>
      </div>

      <SuperAdminMfaForm />
    </div>
  );
}

