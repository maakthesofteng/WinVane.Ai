'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { loginSchema, type TLoginInput } from '@/shared/schemas/auth.schema';
import { useLogin } from '../hooks/useLogin';
import { useResendVerification } from '../hooks/useResendVerification';
import { getSafeRedirectUrl } from '../utils/authRedirect';
import { FormErrorAlert } from './FormErrorAlert';
import { PasswordField } from './PasswordField';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const isVerified = searchParams.get('verified') === '1';
  const isReset = searchParams.get('reset') === '1';
  const isExpired = searchParams.get('expired') === '1';
  const isInvited = searchParams.get('invited') === '1';

  const [formAlert, setFormAlert] = React.useState<string | null>(null);
  const [showResend, setShowResend] = React.useState(false);

  const { mutate: login, isPending } = useLogin();
  const { mutate: resend, isPending: isResending, isSuccess: resendSuccess } = useResendVerification();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TLoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: TLoginInput) => {
    setFormAlert(null);
    setShowResend(false);

    login(values, {
      onSuccess: (data) => {
        if (data.status === 'authenticated') {
          toast.success('Welcome back! Signed in successfully.');
          router.replace(getSafeRedirectUrl(nextParam, ROUTES.DASHBOARD));
        } else if (data.status === 'mfa_required') {
          toast.info('Two-factor authentication required. Please enter your code.');
          const mfaTarget = nextParam
            ? `${ROUTES.MFA}?next=${encodeURIComponent(nextParam)}`
            : ROUTES.MFA;
          router.push(mfaTarget);
        }
      },
      onError: (err) => {
        setValue('password', '');
        let msg = 'Invalid email or password.';
        if (err.code === 'INVALID_CREDENTIALS' || err.statusCode === 401) {
          msg = 'Invalid email or password.';
        } else if (err.code === 'EMAIL_NOT_VERIFIED') {
          setShowResend(true);
          msg = 'Your email address has not been verified yet.';
        } else if (err.code === 'ACCOUNT_SUSPENDED' || err.code === 'WORKSPACE_SUSPENDED') {
          msg = 'Your account or workspace has been suspended. Please contact support.';
        } else if (err.statusCode === 429) {
          msg = 'Too many failed attempts. Please try again in a few minutes.';
        } else if (err.statusCode >= 500 || err.statusCode === 0) {
          msg = 'Unable to connect to the server. Please check your credentials or try again later.';
        } else {
          msg = err.messages[0] || 'Invalid email or password.';
        }
        setFormAlert(msg);
        toast.error(msg);
      },
    });
  };

  const handleResend = () => {
    const email = getValues('email');
    if (email) {
      resend(
        { email },
        {
          onSuccess: () => {
            toast.success('Verification link resent to your email.');
          },
          onError: (resendErr) => {
            toast.error(resendErr.messages.join('. ') || 'Failed to resend verification email.');
          },
        },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
      {isVerified && (
        <div className="auth-alert-box auth-alert-success text-xs">
          Your email is verified — sign in to continue.
        </div>
      )}
      {isReset && (
        <div className="auth-alert-box auth-alert-success text-xs">
          Password updated — sign in with your new password.
        </div>
      )}
      {isExpired && (
        <div className="auth-alert-box auth-alert-info text-xs">
          Your session ended. Please sign in again.
        </div>
      )}
      {isInvited && (
        <div className="auth-alert-box auth-alert-success text-xs">
          Your account is ready — sign in to continue.
        </div>
      )}
      {formAlert && <FormErrorAlert error={formAlert} />}
      {showResend && (
        <div className="space-y-2">
          {resendSuccess ? (
            <p className="text-xs text-primary font-medium">Verification link sent! Check your inbox.</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="auth-link text-xs underline cursor-pointer"
            >
              {isResending ? 'Sending...' : 'Click here to resend verification email'}
            </button>
          )}
        </div>
      )}

      <div className="auth-form-group">
        <Label htmlFor="email" className="auth-label">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          disabled={isPending}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && <p className="auth-field-error">{errors.email.message}</p>}
      </div>

      <div className="auth-form-group">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="auth-label">Password</Label>
          <Link href={ROUTES.FORGOT_PASSWORD} className="auth-link-subtle text-xs">
            Forgot password?
          </Link>
        </div>
        <PasswordField
          id="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          disabled={isPending}
          error={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password && <p className="auth-field-error">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isPending} className="auth-button-primary mt-1">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <div className="auth-guidance-panel mt-2">
        <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p>Enterprise security: Sessions use HttpOnly encrypted cookies with CSRF defense and rate limiting.</p>
      </div>
    </form>
  );
}
