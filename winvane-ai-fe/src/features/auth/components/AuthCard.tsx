import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface IAuthCardProps {
  title: string;
  subtitle?: string;
  overline?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  overline,
  children,
  footer,
  className,
}: IAuthCardProps) {
  return (
    <div className={cn('w-full space-y-6', className)}>
      <header className="space-y-2 text-left">
        {overline && <p className="auth-card-overline">{overline}</p>}
        <h1 className="auth-card-title">{title}</h1>
        {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
      </header>

      <div className="space-y-4">{children}</div>

      {footer && <footer className="pt-2">{footer}</footer>}
    </div>
  );
}
