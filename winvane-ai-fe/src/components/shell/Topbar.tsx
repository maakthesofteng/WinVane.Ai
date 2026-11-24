import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ITopbarProps {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  mobileNav?: React.ReactNode;
  showAdminBorder?: boolean;
  className?: string;
}

export function Topbar({
  leftSlot,
  rightSlot,
  mobileNav,
  showAdminBorder = false,
  className,
}: ITopbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/70 bg-card/95 px-4 lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-card/75',
        showAdminBorder && 'border-t-2 border-t-primary',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {mobileNav}
        {leftSlot}
      </div>

      <div className="flex items-center gap-3">{rightSlot}</div>
    </header>
  );
}

