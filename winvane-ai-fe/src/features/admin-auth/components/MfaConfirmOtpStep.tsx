'use client';

import * as React from 'react';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

export interface IMfaConfirmOtpStepProps {
  confirmCode: string;
  onConfirmCodeChange: (code: string) => void;
  isConfirmPending: boolean;
  onBackToQr: () => void;
}

export function MfaConfirmOtpStep({
  confirmCode,
  onConfirmCodeChange,
  isConfirmPending,
  onBackToQr,
}: IMfaConfirmOtpStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Verify authenticator setup
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter the 6-digit verification code currently shown in your authenticator app.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="setup-confirm-otp" className="auth-label block text-center">
          Authentication code
        </Label>
        <div className="flex justify-center py-1">
          <InputOTP
            id="setup-confirm-otp"
            maxLength={6}
            value={confirmCode}
            onChange={onConfirmCodeChange}
            disabled={isConfirmPending}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {isConfirmPending && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Verifying setup code...
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onBackToQr}
        className="auth-link text-xs inline-flex items-center gap-1 cursor-pointer"
      >
        <ArrowLeft className="size-3.5" />
        Back to QR code
      </button>
    </div>
  );
}

