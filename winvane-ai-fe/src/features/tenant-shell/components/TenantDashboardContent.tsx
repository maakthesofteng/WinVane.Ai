'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { ShieldAlert, X, Sparkles, Building, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { selectCurrentUser, selectWorkspace } from '@/store/slices/authSlice';
import { ROUTES } from '@/constants/routes';

export function TenantDashboardContent() {
  const user = useSelector(selectCurrentUser);
  const workspace = useSelector(selectWorkspace);

  const mfaBannerKey = user ? `wv_dismiss_mfa_banner_${user.id}` : null;
  const [isLocallyDismissed, setIsLocallyDismissed] = React.useState(false);

  const subscribe = React.useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const isBannerDismissed = React.useSyncExternalStore(
    subscribe,
    () => {
      if (!mfaBannerKey) return true;
      try {
        return localStorage.getItem(mfaBannerKey) === 'true';
      } catch {
        return false;
      }
    },
    () => true
  );

  const handleDismissBanner = () => {
    setIsLocallyDismissed(true);
    if (!mfaBannerKey) return;
    try {
      localStorage.setItem(mfaBannerKey, 'true');
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore localStorage failure
    }
  };

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there';
  const showMfaBanner = Boolean(
    user && !user.mfaEnabled && !isBannerDismissed && !isLocallyDismissed
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Dismissible 2FA Banner */}
      {showMfaBanner && (
        <div
          role="region"
          aria-label="Security recommendation"
          className="relative flex flex-col gap-3 rounded-xl border border-primary/50 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between text-foreground"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Protect your workspace — turn on two-factor authentication
              </p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to prevent unauthorized access to your leads and team data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <Link
              href={ROUTES.SETTINGS_SECURITY}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Turn on 2FA
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissBanner}
              aria-label="Dismiss security notice"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/20"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Greeting Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome, {firstName}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {workspace?.name && (
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Building className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {workspace.name}
            </span>
          )}
          {workspace?.domain && (
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              {workspace.domain}
            </span>
          )}
        </div>
      </div>

      {/* Overview Info Card */}
      <Card className="border-border/70 bg-card">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Platform Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Module 1 Foundation Active</p>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your dashboard is on its way — lead recommendations arrive with Company Brain and Lead Sourcing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
