'use client';

import * as React from 'react';
import { UserAvatar, type IUserAvatarProps } from './UserAvatar';
import { cn } from '@/lib/utils/cn';

export interface IAvatarStackUser {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface IAvatarStackProps {
  users: IAvatarStackUser[];
  max?: number;
  size?: IUserAvatarProps['size'];
  className?: string;
}

const COUNTER_SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-base',
};

export function AvatarStack({
  users,
  max = 4,
  size = 'sm',
  className,
}: IAvatarStackProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {visibleUsers.map((user, idx) => (
        <div key={`${user.name}-${idx}`} className="ring-2 ring-background rounded-full">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          data-testid="avatar-stack-overflow"
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold ring-2 ring-background select-none',
            COUNTER_SIZES[size || 'sm']
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

