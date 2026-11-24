import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface IPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: IPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 pb-6 border-b border-border md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

