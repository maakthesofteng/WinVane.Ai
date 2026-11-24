'use client';

import * as React from 'react';
import { AppModal } from './AppModal';

export interface IConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading: externalLoading,
  onConfirm,
  onCancel,
}: IConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const isBusy = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleConfirm = async () => {
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
      onOpenChange(false);
    } catch {
      // Keep dialog open on error
    } finally {
      setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={title}
      primaryAction={{
        label: confirmLabel,
        variant,
        loading: isBusy,
        onClick: handleConfirm,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: handleCancel,
      }}
      preventCloseWhileLoading
    >
      <div className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </div>
    </AppModal>
  );
}

// Hook & Context for imperative confirm(...)
export interface IConfirmOptions {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

interface IConfirmContextType {
  confirm: (options: IConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<IConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = React.useState<{
    options: IConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = React.useCallback((options: IConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({ options, resolve });
    });
  }, []);

  const handleClose = (confirmed: boolean) => {
    if (dialogState) {
      dialogState.resolve(confirmed);
      setDialogState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogState && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose(false);
          }}
          title={dialogState.options.title}
          description={dialogState.options.description}
          confirmLabel={dialogState.options.confirmLabel}
          cancelLabel={dialogState.options.cancelLabel}
          variant={dialogState.options.variant}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: IConfirmOptions) => Promise<boolean> {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

