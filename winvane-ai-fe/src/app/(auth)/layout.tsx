import * as React from 'react';
import { AuthSplitLayout } from '@/features/auth';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthSplitLayout>{children}</AuthSplitLayout>;
}
