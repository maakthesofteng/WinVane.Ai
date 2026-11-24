import type { Metadata } from 'next';
import { MfaSetupStepper } from '@/features/admin-auth';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuperAdminMfaSetupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Set up two-factor authentication
        </h1>
        <p className="text-xs text-muted-foreground">
          Mandatory two-factor authentication for platform access.
        </p>
      </div>

      <MfaSetupStepper />
    </div>
  );
}

