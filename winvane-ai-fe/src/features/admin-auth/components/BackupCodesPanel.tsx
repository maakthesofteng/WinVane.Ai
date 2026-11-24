'use client';

import * as React from 'react';
import { Check, Copy, Download, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export interface IBackupCodesPanelProps {
  backupCodes: string[];
  isConfirmed: boolean;
  onConfirmChange: (confirmed: boolean) => void;
  className?: string;
}

export function BackupCodesPanel({
  backupCodes,
  isConfirmed,
  onConfirmChange,
  className = '',
}: IBackupCodesPanelProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopied(true);
      toast.success('All backup codes copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy backup codes');
    }
  };

  const handleDownload = () => {
    const fileContent = [
      'WinVane.ai Two-Factor Authentication Backup Codes',
      `Generated: ${new Date().toUTCString()}`,
      '------------------------------------------------',
      'Each recovery code can only be used once.',
      'Store these codes in a safe and secure location.',
      '',
      ...backupCodes,
    ].join('\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'winvane-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded as winvane-backup-codes.txt');
  };

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-left text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            Store these recovery codes safely
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Each code works only once to sign in if you lose your authenticator. They will not be displayed again.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="grid grid-cols-2 gap-2 text-center font-mono text-sm font-semibold tracking-wider text-foreground">
          {backupCodes.map((code, index) => (
            <div
              key={`${code}-${index}`}
              className="rounded-md border border-border/60 bg-background/80 py-1.5 px-2 select-all"
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-primary" />
              Copied all codes
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy all codes
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <Download className="size-3.5" />
          Download .txt
        </button>
      </div>

      <div className="pt-2">
        <label className="flex items-center justify-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <span>I have saved these backup codes in a safe place</span>
        </label>
      </div>
    </div>
  );
}

