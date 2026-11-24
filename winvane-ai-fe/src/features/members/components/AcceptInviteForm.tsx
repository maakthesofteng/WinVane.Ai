'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { Label } from '@/components/ui/label';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { PasswordRequirements } from '@/features/auth/components/PasswordRequirements';
import { passwordComplexitySchema } from '@/shared/schemas/password.schema';
import { useValidateInvitation } from '../hooks/useValidateInvitation';
import { useAcceptInvitation } from '../hooks/useAcceptInvitation';
import { ApiError } from '@/lib/api/apiError';

const acceptInviteFormSchema = z
  .object({
    password: passwordComplexitySchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type TAcceptInviteValues = z.infer<typeof acceptInviteFormSchema>;

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract token, store in state, and strip from browser history URL
  const [token, setToken] = React.useState<string>(() => searchParams.get('token') || '');

  React.useEffect(() => {
    const raw = searchParams.get('token');
    if (raw) {
      setToken(raw);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams]);

  const { data: inviteData, isLoading: isValidating, error: validateError } = useValidateInvitation(token);
  const { mutate: acceptInvite, isPending: isAccepting } = useAcceptInvitation();

  const [formAlert, setFormAlert] = React.useState<string | null>(null);

  const form = useForm<TAcceptInviteValues>({
    resolver: zodResolver(acceptInviteFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const passwordValue = watch('password');

  if (!token) {
    return (
      <AuthCard title="Invalid invitation" subtitle="No invitation token was provided.">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            This invitation link is invalid or incomplete.
          </p>
          <Link href="/login" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
            Return to Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (isValidating) {
    return (
      <AuthCard title="Validating invitation..." subtitle="Please wait while we verify your invite link.">
        <div className="flex justify-center p-8">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </AuthCard>
    );
  }

  if (validateError || !inviteData) {
    const apiErr = validateError instanceof ApiError ? validateError : null;
    const isExpired = apiErr?.code === 'INVITE_EXPIRED' || apiErr?.statusCode === 410;

    return (
      <AuthCard
        title={isExpired ? 'Invitation expired' : 'Invalid invitation'}
        subtitle={
          isExpired
            ? 'This invitation link has expired.'
            : 'This invitation link is invalid or has already been used.'
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <span>
              {isExpired
                ? 'Ask your workspace administrator to resend you a new invitation.'
                : 'Please check the link in your email or return to sign in.'}
            </span>
          </div>
          <Link href="/login" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
            Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  const onSubmit = (values: TAcceptInviteValues) => {
    setFormAlert(null);

    acceptInvite(
      { token, password: values.password },
      {
        onSuccess: (res) => {
          router.replace(`${res.redirectTo || '/login'}?invited=1`);
        },
        onError: (err: unknown) => {
          const apiErr = err instanceof ApiError ? err : null;
          const msg = apiErr?.messages.join('. ') || (err instanceof Error ? err.message : 'Failed to activate account.');
          setFormAlert(msg);
        },
      }
    );
  };

  return (
    <AuthCard
      title={`Join ${inviteData.workspaceName}`}
      subtitle="Set up your password to activate your account."
    >
      {/* Read-only member details */}
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Invited member:</span>
          <span className="text-foreground font-semibold">{inviteData.fullName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Email:</span>
          <span className="text-foreground">{inviteData.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Assigned role:</span>
          <span className="text-foreground font-semibold">{inviteData.roleName}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formAlert && <FormErrorAlert error={formAlert} />}

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Create password</Label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            error={Boolean(errors.password)}
            {...register('password')}
          />
          <PasswordRequirements password={passwordValue} email={inviteData.email} />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordField
            id="confirmPassword"
            autoComplete="new-password"
            error={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isAccepting} className="w-full gap-2 mt-2">
          {isAccepting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}

