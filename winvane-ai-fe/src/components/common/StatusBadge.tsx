'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

export type TMemberStatus = 'invited' | 'active' | 'inactive';

export interface IStatusBadgeProps {
  status: TMemberStatus;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  TMemberStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className:
      'bg-primary/15 text-primary border-primary/20 hover:bg-primary/20',
  },
  invited: {
    label: 'Invited',
    className:
      'bg-transparent text-primary border-primary/40 hover:bg-primary/5',
  },
  inactive: {
    label: 'Inactive',
    className:
      'bg-muted text-muted-foreground border-border/50 hover:bg-muted/80',
  },
};

export function StatusBadge({ status, label, className }: IStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;

  return (
    <Badge
      variant="outline"
      className={cn('capitalize text-xs font-medium px-2 py-0.5', config.className, className)}
    >
      {label || config.label}
    </Badge>
  );
}
