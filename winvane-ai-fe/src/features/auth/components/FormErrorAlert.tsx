import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { ApiError } from '@/lib/api/apiError';
import { cn } from '@/lib/utils/cn';

export interface IFormErrorAlertProps {
  error: unknown;
  fallbackMessage?: string;
  className?: string;
}

export function FormErrorAlert({
  error,
  fallbackMessage = 'An unexpected error occurred. Please try again.',
  className,
}: IFormErrorAlertProps) {
  if (!error) {
    return null;
  }

  let message = fallbackMessage;
  let requestId: string | undefined;

  if (error instanceof ApiError) {
    message = error.messages.join('. ');
    requestId = error.requestId;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return (
    <div
      role="alert"
      className={cn('auth-alert-box auth-alert-error', className)}
    >
      <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-relaxed">{message}</p>
        {requestId && (
          <p className="text-xs opacity-80">
            Request ID:{' '}
            <span className="badge-ref">
              {requestId.slice(0, 8)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

