import * as React from 'react';
import { TenantSessionGate } from '@/features/session';
import { TenantShell } from '@/features/tenant-shell';

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TenantSessionGate>
      <TenantShell>{children}</TenantShell>
    </TenantSessionGate>
  );
}
