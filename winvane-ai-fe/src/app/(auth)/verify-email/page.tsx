'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { AuthCard, FormErrorAlert, useResendVerification, useVerifyEmail } from '@/features/auth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token] = React.useState<string | null>(() => searchParams.get('token'));
  const [resendEmail, setResendEmail] = React.useState('');
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const [isInvalidToken, setIsInvalidToken] = React.useState<boolean>(
    () => !searchParams.get('token')
  );

  const { mutate: verify, isPending: isVerifying } = useVerifyEmail();
  const { mutate: resend, isPending: isResending, error: resendError } = useResendVerification();

  React.useEffect(() => {
    if (searchParams.get('token')) {
      window.history.replaceState({}, '', ROUTES.VERIFY_EMAIL);
    }
  }, [searchParams]);

  const handleVerify = () => {
    if (!token || isVerifying) return;
    verify(
      { token },
      {
        onSuccess: () => {
          toast.success('Email verified successfully. You can now sign in.');
          router.replace(`${ROUTES.LOGIN}?verified=1`);
        },
        onError: (err) => {
          if (err.code === 'TOKEN_INVALID' || err.statusCode === 400 || err.statusCode === 404) {
            setIsInvalidToken(true);
          }
          toast.error(err.messages?.join('. ') || 'This verification link is invalid or has expired.');
        },
      }
    );
  };

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || isResending) return;
    resend(
      { email: resendEmail.trim() },
      {
        onSuccess: () => {
          setResendSuccess(true);
          toast.success('A new verification link has been sent to your email.');
        },
        onError: (err) => {
          toast.error(err.messages?.join('. ') || 'Failed to resend verification email.');
        },
      }
    );
  };

  if (isInvalidToken) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            This verification link is invalid or has expired
          </h2>
          <p className="text-xs text-muted-foreground">
            Verification links expire after 24 hours. Request a new verification link below:
          </p>
        </div>

        {resendSuccess ? (
          <div className="auth-alert-box auth-alert-success text-xs">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>A new verification link has been sent to your email.</span>
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-3 text-left">
            {resendError && <FormErrorAlert error={resendError} />}
            <div className="auth-form-group">
              <Label htmlFor="resendEmail" className="auth-label">
                Work email
              </Label>
              <Input
                id="resendEmail"
                type="email"
                placeholder="you@company.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={isResending}
              />
            </div>
            <button
              type="submit"
              disabled={isResending || !resendEmail.trim()}
              className="auth-button-primary"
            >
              {isResending ? 'Sending link...' : 'Resend verification email'}
            </button>
          </form>
        )}

        <div>
          <Link href={ROUTES.LOGIN} className="auth-link-subtle">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="size-6" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-foreground">
          Click the button below to confirm your email address and activate your workspace.
        </p>
        <p className="text-xs text-muted-foreground">
          This explicit confirmation protects your account security.
        </p>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={isVerifying}
        className="auth-button-primary"
      >
        {isVerifying ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Verifying email...
          </>
        ) : (
          'Verify email'
        )}
      </button>

      <div>
        <Link href={ROUTES.LOGIN} className="auth-link-subtle">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard
      overline="WORKSPACE ACTIVATION"
      title="Verify business email"
      subtitle="Confirm your email address to complete workspace activation."
    >
      <React.Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <VerifyEmailContent />
      </React.Suspense>
    </AuthCard>
  );
}
