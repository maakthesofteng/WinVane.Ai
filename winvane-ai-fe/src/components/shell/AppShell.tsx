import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface IAppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({
  sidebar,
  topbar,
  children,
  className,
}: IAppShellProps) {
  return (
    <div className={cn('flex min-h-screen w-full bg-background text-foreground', className)}>
      {/* Skip to main content accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to content
      </a>

      {sidebar}

      <div className="flex flex-1 flex-col overflow-hidden">
        {topbar}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

