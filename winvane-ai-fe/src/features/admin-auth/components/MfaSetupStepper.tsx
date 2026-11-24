'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAppDispatch } from '@/store/hooks';
import { sessionResolved } from '@/store/slices/authSlice';
import { useAdminMfaSetup } from '../hooks/useAdminMfaSetup';
import { useAdminMfaSetupConfirm } from '../hooks/useAdminMfaSetupConfirm';
import { MfaEnrollmentQr } from './MfaEnrollmentQr';
import { MfaConfirmOtpStep } from './MfaConfirmOtpStep';
import { BackupCodesPanel } from './BackupCodesPanel';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import type { IAdminUser } from '../types/adminAuthApi.types';

export function MfaSetupStepper() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [otpauthUrl, setOtpauthUrl] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [confirmCode, setConfirmCode] = React.useState('');
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [adminUser, setAdminUser] = React.useState<IAdminUser | null>(null);
  const [isBackupSaved, setIsBackupSaved] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const hasFetchedRef = React.useRef(false);
  const { mutate: beginSetup, isPending: isSetupPending } = useAdminMfaSetup();
  const { mutate: confirmSetup, isPending: isConfirmPending } = useAdminMfaSetupConfirm();

  // Load setup details on mount
  React.useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    beginSetup(undefined, {
      onSuccess: (data) => {
        setOtpauthUrl(data.otpauthUrl);
        setSecret(data.secret);
      },
      onError: (err) => {
        if (err.code === 'MFA_CHALLENGE_EXPIRED') {
          toast.error('Your sign-in attempt expired. Please sign in again.');
          router.replace(ROUTES.SUPERADMIN_LOGIN);
        } else {
          const msg = err.messages?.join('. ') || 'Failed to initialize MFA setup.';
          setErrorMessage(msg);
          toast.error(msg);
        }
      },
    });
  }, [beginSetup, router]);

  // Warn before leaving on step 3 before confirming
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === 3 && !isBackupSaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, isBackupSaved]);

  // Clean memory on unmount
  React.useEffect(() => {
    return () => {
      setSecret('');
      setBackupCodes([]);
    };
  }, []);

  const handleConfirmCodeSubmit = (codeToSubmit: string) => {
    setErrorMessage(null);
    confirmSetup(
      { code: codeToSubmit },
      {
        onSuccess: (res) => {
          toast.success('MFA activated successfully! Please store your recovery codes.');
          setBackupCodes(res.backupCodes);
          setAdminUser(res.user);
          setStep(3);
        },
        onError: (err) => {
          if (err.code === 'MFA_CHALLENGE_EXPIRED') {
            toast.error('Your sign-in attempt expired. Please sign in again.');
            router.replace(ROUTES.SUPERADMIN_LOGIN);
          } else if (err.code === 'MFA_INVALID') {
            setErrorMessage('Invalid verification code. Please try again.');
            toast.error('Invalid verification code. Please try again.');
            setConfirmCode('');
          } else {
            const msg = err.messages?.join('. ') || 'Verification failed.';
            setErrorMessage(msg);
            toast.error(msg);
          }
        },
      }
    );
  };

  const handleFinalize = () => {
    if (!adminUser) return;
    toast.success('Welcome to SuperAdmin Portal.');
    dispatch(
      sessionResolved({
        portal: 'admin',
        user: adminUser,
        workspace: null,
      })
    );
    router.replace(ROUTES.ADMIN_DASHBOARD);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={step === 1 ? 'text-primary font-bold' : ''}>1. Scan</span>
        <span className="text-border">/</span>
        <span className={step === 2 ? 'text-primary font-bold' : ''}>2. Confirm</span>
        <span className="text-border">/</span>
        <span className={step === 3 ? 'text-primary font-bold' : ''}>3. Backup codes</span>
      </div>

      {errorMessage && <FormErrorAlert error={errorMessage} />}

      {step === 1 && (
        <div className="space-y-6">
          <MfaEnrollmentQr otpauthUrl={otpauthUrl} secret={secret} />
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={isSetupPending || !otpauthUrl}
            className="auth-button-primary flex items-center justify-center gap-2"
          >
            {isSetupPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Preparing authenticator...
              </>
            ) : (
              <>
                Next: Enter verification code
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      )}

      {step === 2 && (
        <MfaConfirmOtpStep
          confirmCode={confirmCode}
          onConfirmCodeChange={(val) => {
            setConfirmCode(val);
            if (val.length === 6 && !isConfirmPending) {
              handleConfirmCodeSubmit(val);
            }
          }}
          isConfirmPending={isConfirmPending}
          onBackToQr={() => {
            setStep(1);
            setErrorMessage(null);
          }}
        />
      )}

      {step === 3 && (
        <div className="space-y-6">
          <BackupCodesPanel
            backupCodes={backupCodes}
            isConfirmed={isBackupSaved}
            onConfirmChange={setIsBackupSaved}
          />
          <button
            type="button"
            onClick={handleFinalize}
            disabled={!isBackupSaved}
            className="auth-button-primary flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4" />
            Continue to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
