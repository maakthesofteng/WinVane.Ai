'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface IAppModalAction {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  form?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
}

export interface IAppModalSecondaryAction {
  label?: string;
  onClick?: () => void;
}

export interface IAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  primaryAction?: IAppModalAction;
  secondaryAction?: IAppModalSecondaryAction;
  isDirty?: boolean;
  preventCloseWhileLoading?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const SIZE_CLASSES: Record<NonNullable<IAppModalProps['size']>, string> = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[520px]',
  lg: 'sm:max-w-[720px]',
  xl: 'sm:max-w-[960px]',
};

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  footer,
  primaryAction,
  secondaryAction,
  isDirty = false,
  preventCloseWhileLoading = true,
  initialFocusRef,
}: IAppModalProps) {
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  const isBusy = preventCloseWhileLoading && Boolean(primaryAction?.loading);

  const requestClose = React.useCallback(() => {
    if (isBusy) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onOpenChange(false);
  }, [isBusy, isDirty, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      requestClose();
    } else {
      onOpenChange(true);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={!isBusy}
          className={cn(
            'flex flex-col p-0 gap-0 overflow-hidden',
            'w-full max-sm:h-full max-sm:max-h-screen max-sm:rounded-none sm:max-h-[85vh]',
            SIZE_CLASSES[size]
          )}
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border/60 shrink-0">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Scrollable Body */}
          <div
            ref={initialFocusRef as React.RefObject<HTMLDivElement>}
            className="flex-1 overflow-y-auto px-6 py-4"
          >
            {children}
          </div>

          {/* Footer */}
          {footer !== undefined ? (
            footer
          ) : (
            <div className="flex items-center justify-end gap-2.5 border-t border-border/60 bg-muted/20 px-6 py-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => {
                  if (secondaryAction?.onClick) {
                    secondaryAction.onClick();
                  } else {
                    requestClose();
                  }
                }}
              >
                {secondaryAction?.label || 'Cancel'}
              </Button>
              {primaryAction && (
                <Button
                  type={primaryAction.type || 'button'}
                  form={primaryAction.form}
                  variant={primaryAction.variant || 'default'}
                  size="sm"
                  disabled={primaryAction.disabled || primaryAction.loading}
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  {primaryAction.label}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Discard confirmation dialog */}
      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent className="sm:max-w-[400px] p-6">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              You have unsaved changes that will be lost if you leave.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDiscardConfirm(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDiscard}
            >
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

