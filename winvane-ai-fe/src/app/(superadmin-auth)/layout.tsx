import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

export default function SuperAdminAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Background radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Link href="/" tabIndex={-1} className="inline-block outline-none">
            <Logo size="md" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xl backdrop-blur-md sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

