import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface IFullPageSpinnerProps {
  message?: string;
  className?: string;
}

export function FullPageSpinner({ message, className }: IFullPageSpinnerProps) {
  return (
    <div
      className={cn(
        'flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 p-8 text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="text-sm font-medium">{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

