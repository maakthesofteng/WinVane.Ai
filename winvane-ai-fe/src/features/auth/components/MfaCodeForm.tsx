'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { useAppSelector } from '@/store/hooks';
import { selectAuthStatus } from '@/store/slices/authSlice';
import { useMfaVerify } from '../hooks/useMfaVerify';
import { getSafeRedirectUrl } from '../utils/authRedirect';
import { FormErrorAlert } from './FormErrorAlert';

export interface IMfaCodeFormProps {
  portal?: 'tenant' | 'admin';
  loginRoute?: string;
  destinationRoute?: string;
  supportNote?: string;
  customVerify?: (
    data: { code: string },
    options: {
      onSuccess: (data: { warning?: string; backupCodesRemaining?: number }) => void;
      onError: (err: { code?: string; messages: string[] }) => void;
    }
  ) => void;
  isCustomPending?: boolean;
}

export function MfaCodeForm({
  portal = 'tenant',
  loginRoute = ROUTES.LOGIN,
  destinationRoute = ROUTES.DASHBOARD,
  supportNote,
  customVerify,
  isCustomPending = false,
}: IMfaCodeFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const authStatus = useAppSelector(selectAuthStatus);

  const [otpCode, setOtpCode] = React.useState('');
  const [backupCode, setBackupCode] = React.useState('');
  const [useBackup, setUseBackup] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const { mutate: defaultVerify, isPending: isDefaultPending } = useMfaVerify();
  const isPending = customVerify ? isCustomPending : isDefaultPending;

  React.useEffect(() => {
    // If status is not unknown and not mfa_required, challenge does not exist
    if (authStatus !== 'mfa_required' && authStatus !== 'unknown') {
      toast.error('Your sign-in attempt expired. Please sign in again.');
      router.replace(loginRoute);
    }
  }, [authStatus, router, loginRoute]);

  const submitCode = React.useCallback(
    (codeToVerify: string) => {
      setErrorMessage(null);

      const onSuccess = (data: { warning?: string; backupCodesRemaining?: number }) => {
        if (portal === 'admin') {
          toast.success('SuperAdmin authentication successful. Welcome back!');
        } else {
          toast.success('Two-factor authentication verified. Welcome back!');
        }
        if (data.warning === 'BACKUP_CODE_USED') {
          const remaining = data.backupCodesRemaining ?? 0;
          const destinationAdvice =
            portal === 'admin'
              ? 'run the superadmin reset procedure if needed.'
              : 'regenerate them in Security settings.';
          toast.warning(
            `You used a backup code. ${remaining} remaining — ${destinationAdvice}`
          );
        }
        const destination = getSafeRedirectUrl(nextParam, destinationRoute);
        router.replace(destination);
      };

      const onError = (err: { code?: string; messages: string[] }) => {
        if (err.code === 'MFA_CHALLENGE_EXPIRED') {
          toast.error('Your sign-in attempt expired. Please sign in again.');
          router.replace(loginRoute);
        } else if (err.code === 'MFA_INVALID') {
          const msg = 'Invalid verification code. Please try again.';
          setErrorMessage(msg);
          toast.error(msg);
          setOtpCode('');
        } else {
          const msg = err.messages?.join('. ') || 'Verification failed.';
          setErrorMessage(msg);
          toast.error(msg);
        }
      };

      if (customVerify) {
        customVerify({ code: codeToVerify }, { onSuccess, onError });
      } else {
        defaultVerify({ code: codeToVerify }, { onSuccess, onError });
      }
    },
    [customVerify, defaultVerify, nextParam, router, portal, loginRoute, destinationRoute]
  );

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    if (value.length === 6 && !isPending) {
      submitCode(value);
    }
  };

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (backupCode.trim()) submitCode(backupCode.trim());
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-6" aria-hidden="true" />
      </div>
      {errorMessage && <FormErrorAlert error={errorMessage} />}

      {!useBackup ? (
        <div className="space-y-4 text-center">
          <Label htmlFor="mfa-otp" className="auth-label block text-center">
            Enter 6-digit authentication code
          </Label>
          <div className="flex justify-center py-2">
            <InputOTP
              id="mfa-otp"
              maxLength={6}
              value={otpCode}
              onChange={handleOtpChange}
              disabled={isPending}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {isPending && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Verifying code...
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleBackupSubmit} className="space-y-4">
          <div className="auth-form-group">
            <Label htmlFor="backupCode" className="auth-label">
              Backup recovery code
            </Label>
            <Input
              id="backupCode"
              placeholder="XXXX-XXXX"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              disabled={isPending}
              autoComplete="one-time-code"
            />
          </div>
          <button type="submit" disabled={isPending || !backupCode.trim()} className="auth-button-primary">
            {isPending ? 'Verifying...' : 'Verify backup code'}
          </button>
        </form>
      )}

      <div className="space-y-3 pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            setUseBackup((prev) => !prev);
            setErrorMessage(null);
          }}
          className="auth-link text-xs block mx-auto cursor-pointer"
        >
          {useBackup ? 'Use authenticator app code instead' : 'Use a backup code instead'}
        </button>

        {supportNote && <p className="text-xs text-muted-foreground">{supportNote}</p>}
        <div>
          <Link href={loginRoute} className="auth-link-subtle">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
