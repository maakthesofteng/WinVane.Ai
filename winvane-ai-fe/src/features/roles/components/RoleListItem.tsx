'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import type { IRoleSummary } from '../types/roles.types';

export interface IRoleListItemProps {
  role: IRoleSummary;
  isSelected: boolean;
  isCurrentUserRole: boolean;
  onSelect: () => void;
}

export function RoleListItem({
  role,
  isSelected,
  isCurrentUserRole,
  onSelect,
}: IRoleListItemProps) {
  const memberLabel = role.userCount === 1 ? '1 member' : `${role.userCount} members`;

  const lockTooltipText = isCurrentUserRole
    ? "You can't edit your own role"
    : "You don't have permission to edit this role";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg p-3 transition-colors border relative flex flex-col gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isSelected
          ? 'bg-primary/5 border-primary shadow-xs'
          : 'bg-card border-border/60 hover:bg-muted/50 hover:border-border'
      )}
      aria-current={isSelected ? 'true' : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm text-foreground truncate">
            {role.name}
          </span>
          {!role.canEdit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground shrink-0 cursor-default"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span className="sr-only">{lockTooltipText}</span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{lockTooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Badge
          variant={role.isSystem ? 'secondary' : 'outline'}
          className={cn(
            'text-[10px] px-1.5 py-0 h-4.5 font-normal shrink-0',
            !role.isSystem && 'border-primary/40 text-primary bg-primary/5'
          )}
        >
          {role.isSystem ? 'System' : 'Custom'}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{memberLabel}</span>
      </div>

      {role.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {role.description}
        </p>
      )}
    </button>
  );
}

