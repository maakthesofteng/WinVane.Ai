'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import type { IPermissionItem } from '../types/roles.types';

export interface IPermissionRowProps {
  permission: IPermissionItem;
  checked: boolean;
  disabled: boolean;
  disableReason?: string;
  onToggle: (checked: boolean) => void;
}

export function PermissionRow({
  permission,
  checked,
  disabled,
  disableReason,
  onToggle,
}: IPermissionRowProps) {
  const checkboxId = `perm-${permission.key}`;

  const content = (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2 px-2.5 rounded-md transition-colors',
        disabled ? 'opacity-70 bg-muted/20' : 'hover:bg-muted/40',
        checked && !disabled && 'bg-primary/[0.03]'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Checkbox
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(nextChecked) => onToggle(Boolean(nextChecked))}
          aria-label={permission.label}
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-xs font-medium text-foreground leading-none select-none',
            disabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'
          )}
        >
          {permission.label}
        </label>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground/70 hidden sm:inline">
          {permission.key}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="text-muted-foreground/70 hover:text-foreground cursor-default p-0.5 rounded"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="sr-only">Description for {permission.label}</span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs">
              <p>{permission.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  if (disabled && disableReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<div className="cursor-not-allowed">{content}</div>} />
          <TooltipContent side="top" className="text-xs max-w-xs">
            <p>{disableReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
