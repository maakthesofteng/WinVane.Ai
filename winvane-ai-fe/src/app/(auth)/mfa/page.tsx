import * as React from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { AuthCard, MfaCodeForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Two-factor authentication',
};

export default function MfaPage() {
  return (
    <AuthCard
      overline="SECURITY VERIFICATION"
      title="Two-factor authentication"
      subtitle="Enter your 6-digit verification code to complete sign-in."
    >
      <React.Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <MfaCodeForm />
      </React.Suspense>
    </AuthCard>
  );
}
