'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';

export interface IGlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: IGlobalErrorProps) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#0B1220] p-6 text-[#E6EDF7]">
        <div className="flex max-w-md flex-col items-center space-y-5 rounded-2xl border border-[#24314F] bg-[#111A2E] p-8 text-center shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F05252]/10 text-[#F05252]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Critical System Error</h2>
            <p className="text-sm text-[#8A97B1]">
              A fatal error prevented the application from rendering. Please refresh or try again.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-[#3DDC97] px-4 py-2 text-sm font-semibold text-[#062018] transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

