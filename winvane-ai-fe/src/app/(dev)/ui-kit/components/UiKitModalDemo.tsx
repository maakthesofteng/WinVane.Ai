'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppModal } from '@/components/common/AppModal';
import { useConfirm } from '@/components/common/ConfirmDialog';

export function UiKitModalDemo() {
  const confirm = useConfirm();
  const [modalSize, setModalSize] = React.useState<'sm' | 'md' | 'lg' | 'xl' | null>(null);
  const [dirtyModalOpen, setDirtyModalOpen] = React.useState(false);
  const [dirtyText, setDirtyText] = React.useState('');
  const [formModalOpen, setFormModalOpen] = React.useState(false);

  const handleOpenConfirm = async () => {
    const result = await confirm({
      title: 'Deactivate Team Member',
      description: 'Are you sure you want to deactivate this member? They will lose access immediately.',
      confirmLabel: 'Deactivate',
      variant: 'destructive',
    });
    if (result) {
      toast.success('Action confirmed!');
    } else {
      toast.info('Action canceled');
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    toast.success(`Form submitted with: ${data.get('workspaceName')}`);
    setFormModalOpen(false);
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">Modals & Confirm Dialogs</h3>
      <p className="text-sm text-muted-foreground">
        Standard responsive dialogs with sizing, dirty state protection, and imperative confirm prompts.
      </p>

      <div className="flex flex-wrap gap-3">
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Button
            key={size}
            variant="outline"
            size="sm"
            onClick={() => setModalSize(size)}
          >
            Open Modal ({size.toUpperCase()})
          </Button>
        ))}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setDirtyText('');
            setDirtyModalOpen(true);
          }}
        >
          Dirty State Modal
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFormModalOpen(true)}
        >
          Form Submit Modal
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleOpenConfirm}
        >
          Trigger useConfirm()
        </Button>
      </div>

      {/* Sized modal */}
      {modalSize && (
        <AppModal
          open={!!modalSize}
          onOpenChange={(open) => !open && setModalSize(null)}
          title={`Modal Size: ${modalSize.toUpperCase()}`}
          description={`Demonstrating ${modalSize} responsive popup layout.`}
          size={modalSize}
          primaryAction={{
            label: 'Acknowledge',
            onClick: () => setModalSize(null),
          }}
        >
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
              This modal dynamically scales depending on breakpoint. On screens &lt; 640px, it adapts to a full-screen mobile sheet.
            </p>
            <p>
              Sticky header and footer ensure scrollable content does not obscure title or action controls.
            </p>
          </div>
        </AppModal>
      )}

      {/* Dirty protection modal */}
      <AppModal
        open={dirtyModalOpen}
        onOpenChange={setDirtyModalOpen}
        title="Edit Workspace Settings"
        description="Try typing into the input below and then closing this modal with Esc or the X button."
        size="md"
        isDirty={dirtyText.trim().length > 0}
        primaryAction={{
          label: 'Save Changes',
          onClick: () => {
            toast.success('Changes saved!');
            setDirtyModalOpen(false);
          },
        }}
      >
        <div className="space-y-3 py-2">
          <label className="text-xs font-medium text-foreground">Unsaved Draft</label>
          <Input
            value={dirtyText}
            onChange={(e) => setDirtyText(e.target.value)}
            placeholder="Type something to make this modal dirty..."
          />
          <p className="text-xs text-muted-foreground">
            Dirty status: {dirtyText.trim().length > 0 ? (
              <span className="font-semibold text-amber-500">Dirty (closing triggers confirm)</span>
            ) : (
              <span className="text-muted-foreground">Pristine</span>
            )}
          </p>
        </div>
      </AppModal>

      {/* Form submit modal */}
      <AppModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        title="Create Team"
        description="The primary action button uses form='team-demo-form' to trigger HTML submit."
        size="md"
        primaryAction={{
          label: 'Create Team',
          type: 'submit',
          form: 'team-demo-form',
        }}
      >
        <form id="team-demo-form" onSubmit={handleFormSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Team Name</label>
            <Input name="workspaceName" required placeholder="e.g. Design Systems" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Description</label>
            <Input name="description" placeholder="Optional team purpose" />
          </div>
        </form>
      </AppModal>
    </div>
  );
}

