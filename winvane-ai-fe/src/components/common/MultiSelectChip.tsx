'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import type { ISelectOption } from './select.types';

export interface IMultiSelectChipProps {
  value: string;
  option?: ISelectOption;
  disabled?: boolean;
  onRemove: (val: string, e?: React.MouseEvent) => void;
}

export function MultiSelectChip({ value, option, disabled, onRemove }: IMultiSelectChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      {option?.avatarText && (
        <span className="text-[10px] text-primary font-semibold">{option.avatarText}</span>
      )}
      <span>{option ? option.label : value}</span>
      {!disabled && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${option ? option.label : value}`}
          className="rounded-full p-0.5 hover:bg-background/80 hover:text-foreground text-muted-foreground"
          onClick={(e) => onRemove(value, e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onRemove(value);
          }}
        >
          <X className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

