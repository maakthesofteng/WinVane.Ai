'use client';

import * as React from 'react';
import { Gauge, ShieldCheck, User } from 'lucide-react';
import { useAdminCurrentUser } from '../hooks/useAdminCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminDashboardContent() {
  const { data } = useAdminCurrentUser();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform Overview
        </h1>
        <p className="text-xs text-muted-foreground">
          Platform-level metrics and system observability for WinVane.ai.
        </p>
      </div>

      <Card className="border-border/70 bg-card">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">System Metrics</CardTitle>
            <p className="text-xs text-muted-foreground">Real-time status</p>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Platform overview — metrics arrive in the next step.
          </p>

          {data?.user && (
            <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {data.user.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <User className="h-3 w-3" aria-hidden="true" />
                    {data.user.email} · {data.user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
