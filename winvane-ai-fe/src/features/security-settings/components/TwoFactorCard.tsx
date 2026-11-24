'use client';

import * as React from 'react';
import { ShieldCheck, ShieldAlert, Key, RefreshCw, PowerOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMfaStatus } from '../hooks/useMfaStatus';
import { EnableTwoFactorDialog } from './EnableTwoFactorDialog';
import { DisableTwoFactorDialog } from './DisableTwoFactorDialog';
import { RegenerateBackupCodesDialog } from './RegenerateBackupCodesDialog';
import type { TPortal } from '../types/securityApi.types';

export interface ITwoFactorCardProps {
  portal: TPortal;
}

export function TwoFactorCard({ portal }: ITwoFactorCardProps) {
  const { data: status, isLoading } = useMfaStatus(portal);
  const [isEnableOpen, setIsEnableOpen] = React.useState(false);
  const [isDisableOpen, setIsDisableOpen] = React.useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = React.useState(false);

  const isEnabled = Boolean(status?.enabled);
  const canDisable = portal !== 'admin' && Boolean(status?.canDisable);
  const remainingCodes = status?.backupCodesRemaining ?? 0;
  const isLowCodes = remainingCodes <= 3;

  return (
    <>
      <Card className="border-border/70 bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Two-Factor Authentication</CardTitle>
                <CardDescription className="text-xs">
                  Require a verification code when signing in to your account.
                </CardDescription>
              </div>
            </div>

            {!isLoading && (
              <Badge
                variant={isEnabled ? 'default' : 'outline'}
                className={
                  isEnabled
                    ? 'border-primary/40 bg-primary/15 text-primary text-xs font-semibold'
                    : 'text-muted-foreground text-xs'
                }
              >
                {isEnabled ? 'On' : 'Off'}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {portal === 'admin' ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">Admin Security Policy</p>
              Two-factor authentication is required for platform administrators. If you lose your device, contact the platform operator.
            </div>
          ) : null}

          {isEnabled ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">Recovery Backup Codes</span>
                </div>
                <span
                  className={
                    isLowCodes
                      ? 'font-semibold text-amber-500 flex items-center gap-1'
                      : 'font-medium text-foreground'
                  }
                >
                  {isLowCodes && <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />}
                  {remainingCodes} remaining
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegenerateOpen(true)}
                  className="gap-2 text-xs font-semibold"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Regenerate backup codes
                </Button>

                {canDisable && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDisableOpen(true)}
                    className="gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                    Turn off
                  </Button>
                )}
              </div>
            </div>
          ) : (
            portal !== 'admin' && (
              <div className="pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsEnableOpen(true)}
                  className="font-semibold text-xs"
                >
                  Enable 2FA
                </Button>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <EnableTwoFactorDialog
        portal={portal}
        open={isEnableOpen}
        onOpenChange={setIsEnableOpen}
      />

      <DisableTwoFactorDialog
        portal={portal}
        open={isDisableOpen}
        onOpenChange={setIsDisableOpen}
        canDisable={canDisable}
      />

      <RegenerateBackupCodesDialog
        portal={portal}
        open={isRegenerateOpen}
        onOpenChange={setIsRegenerateOpen}
      />
    </>
  );
}

