'use client';

import * as React from 'react';
import Link from 'next/link';
import { Mail, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useResendVerification } from '../hooks/useResendVerification';
import { FormErrorAlert } from './FormErrorAlert';

export interface ICheckInboxNoticeProps {
  email: string;
}

export function CheckInboxNotice({ email }: ICheckInboxNoticeProps) {
  const [cooldown, setCooldown] = React.useState(60);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const { mutate: resend, isPending, error } = useResendVerification();

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0 || isPending) return;
    resend(
      { email },
      {
        onSuccess: () => {
          setResendSuccess(true);
          setCooldown(60);
        },
      }
    );
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="size-6" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-foreground">
          We&apos;ve sent a verification link to{' '}
          <strong className="text-primary font-semibold">{email}</strong>.
        </p>
        <p className="text-xs text-muted-foreground">
          The link will expire in 24 hours. Check your spam folder if it doesn&apos;t arrive soon.
        </p>
      </div>

      {resendSuccess && (
        <div className="auth-alert-box auth-alert-success text-xs">
          A new verification link has been sent to your email.
        </div>
      )}

      {error && <FormErrorAlert error={error} />}

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isPending}
          className="auth-button-secondary"
        >
          {isPending ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : cooldown > 0 ? (
            `Resend email in ${cooldown}s`
          ) : (
            'Resend verification email'
          )}
        </button>

        <div>
          <Link href={ROUTES.LOGIN} className="auth-link-subtle">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

