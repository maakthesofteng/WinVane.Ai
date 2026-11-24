'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { AuthCard, ResetPasswordForm } from '@/features/auth';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [token] = React.useState<string | null>(() => searchParams.get('token'));

  React.useEffect(() => {
    if (searchParams.get('token')) {
      // Immediately remove token from URL
      window.history.replaceState({}, '', ROUTES.RESET_PASSWORD);
    }
  }, [searchParams]);

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      overline="SECURITY CREDENTIALS"
      title="Set new password"
      subtitle="Enter a new secure password for your workspace account."
    >
      <React.Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <ResetPasswordContent />
      </React.Suspense>
    </AuthCard>
  );
}
