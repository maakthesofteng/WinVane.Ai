'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { resetPasswordSchema, type TResetPasswordInput } from '@/shared/schemas/auth.schema';
import { useResetPassword } from '../hooks/useResetPassword';
import { FormErrorAlert } from './FormErrorAlert';
import { PasswordField } from './PasswordField';
import { PasswordRequirements } from './PasswordRequirements';

export interface IResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: IResetPasswordFormProps) {
  const router = useRouter();
  const [tokenError, setTokenError] = React.useState(!token);
  const { mutate: resetPwd, isPending, error } = useResetPassword();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<TResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const passwordValue = watch('password');

  const onSubmit = (values: TResetPasswordInput) => {
    if (!token) {
      setTokenError(true);
      return;
    }

    resetPwd(
      {
        token,
        newPassword: values.password,
      },
      {
        onSuccess: () => {
          toast.success('Password updated successfully. You can now sign in.');
          router.replace(`${ROUTES.LOGIN}?reset=1`);
        },
        onError: (err) => {
          if (err.code === 'TOKEN_INVALID') {
            setTokenError(true);
            toast.error('This password reset link is invalid or has expired.');
          } else if (err.code === 'PASSWORD_POLICY') {
            const msg = err.messages.join('. ') || 'Password does not meet security requirements.';
            setError('password', {
              type: 'manual',
              message: msg,
            });
            toast.error(msg);
          } else {
            toast.error(err.messages.join('. ') || 'Failed to update password.');
          }
        },
      }
    );
  };

  if (tokenError) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            This password reset link is invalid or has expired.
          </p>
          <p className="text-xs text-muted-foreground">
            Reset links can only be used once and expire after 1 hour.
          </p>
        </div>
        <div className="space-y-3 pt-2">
          <Link href={ROUTES.FORGOT_PASSWORD} className="auth-button-primary">
            Request new reset link
          </Link>
          <div>
            <Link href={ROUTES.LOGIN} className="auth-link-subtle">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
      {error && error.code !== 'TOKEN_INVALID' && error.code !== 'PASSWORD_POLICY' && (
        <FormErrorAlert error={error} />
      )}

      <div className="auth-form-group">
        <Label htmlFor="password" className="auth-label">
          New password
        </Label>
        <PasswordField
          id="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          disabled={isPending}
          error={Boolean(errors.password)}
          {...register('password')}
        />
        <PasswordRequirements password={passwordValue} />
        {errors.password && (
          <p className="auth-field-error">{errors.password.message}</p>
        )}
      </div>

      <div className="auth-form-group">
        <Label htmlFor="confirmPassword" className="auth-label">
          Confirm new password
        </Label>
        <PasswordField
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••••••"
          disabled={isPending}
          error={Boolean(errors.confirmPassword)}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="auth-field-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending} className="auth-button-primary mt-2">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Updating password...
          </>
        ) : (
          'Update password'
        )}
      </button>

      <p className="auth-footer">
        <Link href={ROUTES.LOGIN} className="auth-link">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

