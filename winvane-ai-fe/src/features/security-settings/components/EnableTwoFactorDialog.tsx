'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/features/auth/components/PasswordField';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { MfaEnrollmentQr } from '@/features/admin-auth/components/MfaEnrollmentQr';
import { BackupCodesPanel } from '@/features/admin-auth/components/BackupCodesPanel';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useMfaSetup } from '../hooks/useMfaSetup';
import { useMfaEnable } from '../hooks/useMfaEnable';
import type { TPortal } from '../types/securityApi.types';

export interface IEnableTwoFactorDialogProps {
  portal: TPortal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
type TStep = 'password' | 'qr' | 'code' | 'backupCodes';

export function EnableTwoFactorDialog({
  portal,
  open,
  onOpenChange,
}: IEnableTwoFactorDialogProps) {
  const setupMutation = useMfaSetup(portal);
  const enableMutation = useMfaEnable(portal);

  const [step, setStep] = React.useState<TStep>('password');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [setupData, setSetupData] = React.useState<{ otpauthUrl: string; secret: string } | null>(null);
  const [code, setCode] = React.useState('');
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [isBackupConfirmed, setIsBackupConfirmed] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const cleanupState = React.useCallback(() => {
    setStep('password');
    setCurrentPassword('');
    setSetupData(null);
    setCode('');
    setBackupCodes([]);
    setIsBackupConfirmed(false);
    setErrorMessage(null);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) cleanupState();
    onOpenChange(newOpen);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await setupMutation.mutateAsync({ currentPassword });
      setSetupData(res);
      setStep('qr');
      toast.info('Scan the QR code with your authenticator app.');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const msg = error?.code === 'INVALID_CURRENT_PASSWORD'
        ? 'Incorrect current password.'
        : error?.message || 'Failed to begin 2FA setup.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) return;
    setErrorMessage(null);
    try {
      const res = await enableMutation.mutateAsync({ code });
      setBackupCodes(res.backupCodes);
      setStep('backupCodes');
      toast.success('Authenticator verified! Please store your recovery codes.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      const msg = error?.message || 'Invalid verification code. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleDone = () => {
    toast.success('Two-factor authentication enabled successfully.');
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-border/80 bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === 'password' && 'Confirm your password'}
            {step === 'qr' && 'Set up authenticator'}
            {step === 'code' && 'Enter authentication code'}
            {step === 'backupCodes' && 'Save backup recovery codes'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 'password' && 'Enter your password to configure two-factor authentication.'}
            {step === 'qr' && 'Scan the QR code with your authenticator app.'}
            {step === 'code' && 'Enter the 6-digit code from your authenticator app.'}
            {step === 'backupCodes' && 'Store these codes in a safe place. Each code can be used once.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && <FormErrorAlert error={errorMessage} className="mt-2" />}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="mfa-current-password" className="text-xs font-medium text-foreground">
                Current Password
              </label>
              <PasswordField
                id="mfa-current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={setupMutation.isPending || !currentPassword.trim()}>
                {setupMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Continue
              </Button>
            </div>
          </form>
        )}

        {step === 'qr' && setupData && (
          <div className="space-y-4 pt-2">
            <MfaEnrollmentQr otpauthUrl={setupData.otpauthUrl} secret={setupData.secret} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={() => setStep('code')}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4 pt-2 text-center">
            <div className="flex justify-center py-2">
              <InputOTP maxLength={6} value={code} onChange={setCode} disabled={enableMutation.isPending}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('qr')}>
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleVerifyCode}
                disabled={code.length !== 6 || enableMutation.isPending}
              >
                {enableMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Verify & Activate
              </Button>
            </div>
          </div>
        )}

        {step === 'backupCodes' && (
          <div className="space-y-4 pt-2">
            <BackupCodesPanel
              backupCodes={backupCodes}
              isConfirmed={isBackupConfirmed}
              onConfirmChange={setIsBackupConfirmed}
            />
            <div className="flex justify-end pt-2">
              <Button type="button" size="sm" onClick={handleDone} disabled={!isBackupConfirmed}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
