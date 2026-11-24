'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { AppModal } from '@/components/common/AppModal';
import { SearchableSelect, type ISelectOption } from '@/components/common/SearchableSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ApiError } from '@/lib/api/apiError';
import { useCreateRole } from '../hooks/useCreateRole';
import type { ICreateRoleResult, IRoleSummary } from '../types/roles.types';

export interface ICreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRoles: IRoleSummary[];
  onCreated: (newRole: ICreateRoleResult) => void;
}

export function CreateRoleModal({
  open,
  onOpenChange,
  existingRoles,
  onCreated,
}: ICreateRoleModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [copyFromRoleId, setCopyFromRoleId] = React.useState<string | undefined>('blank');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const createRoleMutation = useCreateRole();

  const roleOptions: ISelectOption[] = React.useMemo(() => {
    return [
      {
        value: 'blank',
        label: 'Blank — no permissions',
        description: 'Start with no initial permissions',
      },
      ...existingRoles.map((r) => ({
        value: r.id,
        label: r.name,
        description: r.isSystem ? 'System role' : 'Custom role',
      })),
    ];
  }, [existingRoles]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNameError(null);
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      setNameError('Role name must be between 2 and 50 characters.');
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        copyFromRoleId: copyFromRoleId && copyFromRoleId !== 'blank' ? copyFromRoleId : undefined,
      };

      const result = await createRoleMutation.mutateAsync(payload);

      if (result.droppedKeys && result.droppedKeys.length > 0) {
        toast.warning("Some permissions you don't have were not copied.");
      } else {
        toast.success(`Role "${result.name}" created.`);
      }

      onCreated(result);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ROLE_NAME_TAKEN') {
          setNameError('A role with this name already exists.');
          return;
        }
        if (err.code === 'ROLE_LIMIT_REACHED') {
          setFormError('Workspace custom role limit reached.');
          return;
        }
        toast.error(err.messages[0] || 'Failed to create role.');
      } else {
        toast.error('Failed to create role.');
      }
    }
  };

  const isDirty = Boolean(name.trim() || description.trim() || (copyFromRoleId && copyFromRoleId !== 'blank'));

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="Create Custom Role"
      description="Create a new workspace role and define its specific permissions."
      isDirty={isDirty}
      primaryAction={{
        label: 'Create role',
        onClick: handleSubmit,
        loading: createRoleMutation.isPending,
        disabled: !name.trim() || createRoleMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => onOpenChange(false),
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {formError && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{formError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="create-role-name">
            Role name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="create-role-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="e.g. Recruiter, Auditor"
            maxLength={50}
            aria-invalid={Boolean(nameError)}
          />
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-role-desc">Description (optional)</Label>
          <Input
            id="create-role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary of this role's responsibilities"
            maxLength={255}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="copy-from-role">Start from</Label>
          <SearchableSelect
            id="copy-from-role"
            value={copyFromRoleId}
            onChange={(val) => setCopyFromRoleId(val ?? 'blank')}
            options={roleOptions}
            placeholder="Select a role template..."
          />
        </div>
      </form>
    </AppModal>
  );
}
