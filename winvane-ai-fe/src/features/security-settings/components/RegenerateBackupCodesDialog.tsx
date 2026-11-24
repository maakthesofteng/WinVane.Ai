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
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { BackupCodesPanel } from '@/features/admin-auth/components/BackupCodesPanel';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useRegenerateBackupCodes } from '../hooks/useRegenerateBackupCodes';
import type { TPortal } from '../types/securityApi.types';

export interface IRegenerateBackupCodesDialogProps {
  portal: TPortal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegenerateBackupCodesDialog({
  portal,
  open,
  onOpenChange,
}: IRegenerateBackupCodesDialogProps) {
  const regenerateMutation = useRegenerateBackupCodes(portal);
  const [step, setStep] = React.useState<'code' | 'results'>('code');
  const [code, setCode] = React.useState('');
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [isConfirmed, setIsConfirmed] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const cleanup = React.useCallback(() => {
    setStep('code');
    setCode('');
    setBackupCodes([]);
    setIsConfirmed(false);
    setErrorMessage(null);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) cleanup();
    onOpenChange(newOpen);
  };

  const handleRegenerate = async () => {
    if (code.length !== 6) return;
    setErrorMessage(null);

    try {
      const res = await regenerateMutation.mutateAsync({ code });
      setBackupCodes(res.backupCodes);
      setStep('results');
      toast.success('Backup recovery codes generated. Please save your new codes.');
    } catch (err: unknown) {
      const error = err as { message?: string };
      const msg = error?.message || 'Invalid verification code. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleDone = () => {
    toast.success('Backup recovery codes regenerated successfully.');
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-border/80 bg-card p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {step === 'code' ? 'Regenerate Backup Codes' : 'New Recovery Codes'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 'code'
              ? 'Enter a 6-digit code from your authenticator app to generate new backup codes. Old codes will be invalidated.'
              : 'Save these new backup codes. Each code can be used once.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && <FormErrorAlert error={errorMessage} className="mt-2" />}

        {step === 'code' && (
          <div className="space-y-4 pt-2 text-center">
            <div className="flex justify-center py-2">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={regenerateMutation.isPending}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRegenerate}
                disabled={code.length !== 6 || regenerateMutation.isPending}
              >
                {regenerateMutation.isPending && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                Generate New Codes
              </Button>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-4 pt-2">
            <BackupCodesPanel
              backupCodes={backupCodes}
              isConfirmed={isConfirmed}
              onConfirmChange={setIsConfirmed}
            />
            <div className="flex justify-end pt-2">
              <Button type="button" size="sm" onClick={handleDone} disabled={!isConfirmed}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
