'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useMfaDisable } from '../hooks/useMfaDisable';
import type { TPortal } from '../types/securityApi.types';

export interface IDisableTwoFactorDialogProps {
  portal: TPortal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canDisable?: boolean;
}

export function DisableTwoFactorDialog({
  portal,
  open,
  onOpenChange,
  canDisable = true,
}: IDisableTwoFactorDialogProps) {
  const disableMutation = useMfaDisable(portal);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const cleanup = React.useCallback(() => {
    setCurrentPassword('');
    setCode('');
    setErrorMessage(null);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) cleanup();
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDisable) return;
    setErrorMessage(null);

    try {
      await disableMutation.mutateAsync({
        currentPassword,
        code,
      });
      toast.success('Two-factor authentication disabled.');
      handleOpenChange(false);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let msg = 'Failed to disable two-factor authentication.';
      if (error?.code === 'INVALID_CURRENT_PASSWORD') {
        msg = 'Incorrect current password.';
      } else if (error?.code === 'MFA_INVALID') {
        msg = 'Invalid authentication code.';
      } else {
        msg = error?.message || msg;
      }
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  if (!canDisable) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-border/80 bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-destructive">
            Turn off two-factor authentication
          </DialogTitle>
          <DialogDescription className="text-xs">
            Enter your current password and a code from your authenticator to disable 2FA. Other devices will be signed out.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && <FormErrorAlert error={errorMessage} className="mt-2" />}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="disable-mfa-pwd" className="text-xs font-medium text-foreground">
              Current Password
            </label>
            <PasswordField
              id="disable-mfa-pwd"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <div className="space-y-1.5 text-center">
            <label htmlFor="disable-mfa-code" className="text-xs font-medium text-foreground block text-left">
              Authentication Code
            </label>
            <div className="flex justify-center py-1">
              <InputOTP
                id="disable-mfa-code"
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={disableMutation.isPending}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={disableMutation.isPending || !currentPassword.trim() || code.length !== 6}
            >
              {disableMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Turn off 2FA
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
