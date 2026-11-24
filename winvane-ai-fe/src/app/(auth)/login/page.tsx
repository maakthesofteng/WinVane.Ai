import * as React from 'react';
import type { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { AuthCard, LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <AuthCard
      overline="YOUR BUSINESS WORKSPACE"
      title="Welcome back"
      subtitle="Sign in to review your matches and keep your Company Brain up to date."
    >
      <React.Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </React.Suspense>
    </AuthCard>
  );
}
