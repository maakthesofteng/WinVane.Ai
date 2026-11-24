'use client';

import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, KeyRound, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export interface IMfaEnrollmentQrProps {
  otpauthUrl: string;
  secret: string;
  className?: string;
}

export function MfaEnrollmentQr({
  otpauthUrl,
  secret,
  className = '',
}: IMfaEnrollmentQrProps) {
  const [copied, setCopied] = React.useState(false);
  const [showManualKey, setShowManualKey] = React.useState(false);

  const formattedSecret = React.useMemo(() => {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  }, [secret]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success('Setup key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`space-y-6 text-center ${className}`}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Scan the QR code
        </h3>
        <p className="text-xs text-muted-foreground">
          Use Google Authenticator, Microsoft Authenticator, 1Password, or any standard TOTP authenticator app.
        </p>
      </div>

      <div className="mx-auto flex size-52 items-center justify-center rounded-xl border border-border bg-white p-3 shadow-sm">
        {otpauthUrl ? (
          <QRCodeSVG
            value={otpauthUrl}
            size={184}
            level="M"
            marginSize={2}
            aria-label="Two-factor authentication QR code"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <QrCode className="size-8 animate-pulse text-muted-foreground/60" />
            Loading QR Code...
          </div>
        )}
      </div>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => setShowManualKey((prev) => !prev)}
          className="auth-link text-xs inline-flex items-center gap-1.5 cursor-pointer"
        >
          <KeyRound className="size-3.5" aria-hidden="true" />
          {showManualKey ? 'Hide manual setup key' : "Can't scan? Enter key manually"}
        </button>

        {showManualKey && (
          <div className="mx-auto max-w-sm rounded-lg border border-border bg-muted/40 p-3 text-left animate-in fade-in-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Manual Setup Key
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-primary" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <code className="mt-1 block font-mono text-xs font-semibold text-foreground tracking-widest break-all select-all">
              {formattedSecret}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

