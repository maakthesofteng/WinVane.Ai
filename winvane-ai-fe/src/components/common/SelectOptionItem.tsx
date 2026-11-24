'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ISelectOption } from './select.types';

export interface ISelectOptionItemProps {
  option: ISelectOption;
}

export function SelectOptionItem({ option }: ISelectOptionItemProps) {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      {option.avatarText && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {option.avatarText}
        </span>
      )}
      <div className="flex flex-col truncate">
        <span className="font-medium text-foreground text-sm truncate">{option.label}</span>
        {option.description && (
          <span className="text-xs text-muted-foreground truncate">{option.description}</span>
        )}
      </div>
      {option.badge && (
        <Badge variant="secondary" className="ml-auto text-[10px] py-0 shrink-0">
          {option.badge}
        </Badge>
      )}
    </div>
  );
}

