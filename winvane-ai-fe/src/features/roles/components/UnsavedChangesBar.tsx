'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface IUnsavedChangesBarProps {
  changeCount: number;
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function UnsavedChangesBar({
  changeCount,
  isSaving,
  onDiscard,
  onSave,
}: IUnsavedChangesBarProps) {
  if (changeCount <= 0) return null;

  const changesLabel = changeCount === 1 ? '1 change' : `${changeCount} changes`;

  return (
    <aside
      aria-label="Unsaved changes bar"
      className="sticky bottom-4 z-30 mx-auto w-full max-w-2xl rounded-xl border border-primary/20 bg-card/95 backdrop-blur-md p-3.5 shadow-xl transition-all animate-in fade-in-50 slide-in-from-bottom-2"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-foreground">
            {changesLabel} pending
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — save to apply
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={isSaving}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Discard
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="text-xs min-w-[110px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

