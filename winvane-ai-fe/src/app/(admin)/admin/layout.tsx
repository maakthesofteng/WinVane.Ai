import * as React from 'react';
import { AdminSessionGate } from '@/features/session';
import { AdminShell } from '@/features/admin-shell';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminSessionGate>
      <AdminShell>{children}</AdminShell>
    </AdminSessionGate>
  );
}
