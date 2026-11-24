'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { forgotPasswordSchema, type TForgotPasswordInput } from '@/shared/schemas/auth.schema';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { FormErrorAlert } from './FormErrorAlert';

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const { mutate: sendReset, isPending, error } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: TForgotPasswordInput) => {
    sendReset(values, {
      onSuccess: () => {
        setSubmitted(true);
        toast.success('If an account exists, a password reset link has been sent.');
      },
      onError: (err) => {
        if (err.statusCode === 429) {
          toast.error('Too many requests. Please wait a few minutes before trying again.');
        } else {
          setSubmitted(true);
          toast.success('If an account exists, a password reset link has been sent.');
        }
      },
    });
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            If an account exists for that email, we&apos;ve sent a password reset link.
          </p>
          <p className="text-xs text-muted-foreground">
            The link will expire in 1 hour. Please check your inbox and spam folder.
          </p>
        </div>
        <div className="pt-2">
          <Link href={ROUTES.LOGIN} className="auth-button-secondary">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
      {error && <FormErrorAlert error={error} />}

      <div className="auth-form-group">
        <Label htmlFor="email" className="auth-label">
          Work email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          disabled={isPending}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && (
          <p className="auth-field-error">{errors.email.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending} className="auth-button-primary mt-2">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          'Send reset link'
        )}
      </button>

      <p className="auth-footer">
        Remembered your password?{' '}
        <Link href={ROUTES.LOGIN} className="auth-link">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

