import * as React from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface IPortalBadgeProps {
  label?: string;
  className?: string;
}

export function PortalBadge({
  label = 'Platform admin',
  className,
}: IPortalBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary tracking-wide select-none',
        className
      )}
    >
      <Shield className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

