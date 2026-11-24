'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { useAdminLogin } from '../hooks/useAdminLogin';

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type TAdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TAdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate: login, isPending } = useAdminLogin();

  const onSubmit = (values: TAdminLoginFormValues) => {
    setErrorMessage(null);
    login(
      { email: values.email, password: values.password },
      {
        onSuccess: (data) => {
          if (data.status === 'mfa_setup_required') {
            toast.info('Initial SuperAdmin setup: Please configure your authenticator app.');
            router.push(ROUTES.SUPERADMIN_MFA_SETUP);
          } else {
            toast.info('SuperAdmin credentials verified. Please enter your authentication code.');
            router.push(ROUTES.SUPERADMIN_MFA);
          }
        },
        onError: (err) => {
          setValue('password', '');
          let msg = 'Invalid email or password.';
          if (err.statusCode === 429) {
            msg = 'Too many attempts. Try again in 15 minutes.';
          } else if (err.code === 'INVALID_CREDENTIALS' || err.statusCode === 401) {
            msg = 'Invalid email or password.';
          } else if (err.statusCode >= 500 || err.statusCode === 0) {
            msg = 'Unable to connect to the server. Please check your credentials or try again later.';
          } else {
            msg = err.messages?.[0] || 'Invalid email or password.';
          }
          setErrorMessage(msg);
          toast.error(msg);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {isExpired && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-950 dark:text-sky-200">
          <Info className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>Your admin session ended. Please sign in again.</span>
        </div>
      )}

      {errorMessage && <FormErrorAlert error={errorMessage} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="auth-form-group">
          <Label htmlFor="admin-email" className="auth-label">
            Email address
          </Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@winvane.ai"
            autoComplete="username"
            disabled={isPending}
            className={errors.email ? 'border-destructive' : ''}
            {...register('email')}
          />
          {errors.email && (
            <p className="auth-error-hint">{errors.email.message}</p>
          )}
        </div>

        <div className="auth-form-group">
          <Label htmlFor="admin-password" className="auth-label">
            Password
          </Label>
          <PasswordField
            id="admin-password"
            placeholder="Enter password"
            autoComplete="current-password"
            disabled={isPending}
            error={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password && (
            <p className="auth-error-hint">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="auth-button-primary flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Lock className="size-4" />
              Sign in to platform
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        Locked out? Contact the platform operator.
      </div>
    </div>
  );
}
