'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { PasswordRequirements } from '@/features/auth/components/PasswordRequirements';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { passwordComplexitySchema } from '@/shared/schemas/password.schema';
import { useChangePassword } from '../hooks/useChangePassword';
import type { TPortal } from '../types/securityApi.types';

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordComplexitySchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type TChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export interface IChangePasswordCardProps {
  portal: TPortal;
}

export function ChangePasswordCard({ portal }: IChangePasswordCardProps) {
  const changePasswordMutation = useChangePassword(portal);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = async (values: TChangePasswordFormValues) => {
    setFormError(null);
    try {
      // Exclude confirmPassword from network payload
      const payload = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };

      await changePasswordMutation.mutateAsync(payload);
      toast.success('Password updated. Other devices were signed out.');
      reset();
    } catch (err: unknown) {
      const error = err as { code?: string; statusCode?: number; message?: string };
      let errorMsg = 'Failed to update password. Please try again.';
      if (error?.code === 'INVALID_CURRENT_PASSWORD') {
        errorMsg = 'Incorrect current password.';
        setError('currentPassword', { message: errorMsg });
      } else if (error?.code === 'PASSWORD_POLICY') {
        errorMsg = error.message || 'New password does not satisfy security policy.';
        setError('newPassword', { message: errorMsg });
      } else if (error?.statusCode === 429) {
        errorMsg = 'Too many attempts. Please try again later.';
        setFormError(errorMsg);
      } else {
        errorMsg = error?.message || errorMsg;
        setFormError(errorMsg);
      }
      toast.error(errorMsg);
    }
  };

  return (
    <Card className="border-border/70 bg-card">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Change Password</CardTitle>
            <CardDescription className="text-xs">
              Update your password and sign out of all other active sessions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
          {formError && <FormErrorAlert error={formError} />}

          <div className="space-y-1.5">
            <label
              htmlFor="currentPassword"
              className="text-xs font-medium text-foreground"
            >
              Current Password
            </label>
            <PasswordField
              id="currentPassword"
              error={Boolean(errors.currentPassword)}
              placeholder="••••••••••••"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className="text-xs font-medium text-foreground"
            >
              New Password
            </label>
            <PasswordField
              id="newPassword"
              error={Boolean(errors.newPassword)}
              placeholder="••••••••••••"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword.message}</p>
            )}
            <PasswordRequirements password={newPasswordValue} className="pt-1" />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-medium text-foreground"
            >
              Confirm New Password
            </label>
            <PasswordField
              id="confirmPassword"
              error={Boolean(errors.confirmPassword)}
              placeholder="••••••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || changePasswordMutation.isPending}
            className="w-full sm:w-auto font-semibold"
          >
            {(isSubmitting || changePasswordMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
