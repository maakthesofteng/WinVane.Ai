'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';

export interface IUserAvatarProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return clean.slice(0, clean.includes('@') ? 1 : 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 'md',
  className,
}: IUserAvatarProps) {
  const displayName = name || email || '';
  const initials = getInitials(displayName);

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback className="bg-primary/10 text-primary font-medium select-none">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
