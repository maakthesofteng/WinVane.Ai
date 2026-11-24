'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { AppModal } from '@/components/common/AppModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api/apiError';
import { useUpdateRole } from '../hooks/useUpdateRole';
import type { IRoleSummary } from '../types/roles.types';

export interface IEditRoleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: IRoleSummary;
  onUpdated: (updatedRole: IRoleSummary) => void;
}

export function EditRoleDetailsModal({
  open,
  onOpenChange,
  role,
  onUpdated,
}: IEditRoleDetailsModalProps) {
  const [name, setName] = React.useState(role.name);
  const [description, setDescription] = React.useState(role.description ?? '');
  const [nameError, setNameError] = React.useState<string | null>(null);

  const updateRoleMutation = useUpdateRole(role.id);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNameError(null);

    const trimmedName = name.trim();
    if (!role.isSystem && (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50)) {
      setNameError('Role name must be between 2 and 50 characters.');
      return;
    }

    try {
      const payload = {
        name: role.isSystem ? undefined : trimmedName,
        description: description.trim() || undefined,
      };

      const result = await updateRoleMutation.mutateAsync(payload);
      toast.success('Role details updated.');
      onUpdated(result);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ROLE_NAME_TAKEN') {
          setNameError('A role with this name already exists.');
          return;
        }
        if (err.code === 'SYSTEM_ROLE_NAME_IMMUTABLE') {
          setNameError('System role names cannot be renamed.');
          return;
        }
        toast.error(err.messages[0] || 'Failed to update role details.');
      } else {
        toast.error('Failed to update role details.');
      }
    }
  };

  const isDirty =
    (!role.isSystem && name.trim() !== role.name) ||
    description.trim() !== (role.description ?? '');

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={`Edit ${role.name}`}
      description="Update the name and description of this role."
      isDirty={isDirty}
      primaryAction={{
        label: 'Save details',
        onClick: handleSubmit,
        loading: updateRoleMutation.isPending,
        disabled: updateRoleMutation.isPending || (!role.isSystem && !name.trim()),
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => onOpenChange(false),
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="edit-role-name">
            Role name {!role.isSystem && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="edit-role-name"
            value={name}
            disabled={role.isSystem}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Role name"
            maxLength={50}
            aria-invalid={Boolean(nameError)}
          />
          {role.isSystem && (
            <p className="text-xs text-muted-foreground">
              System role names cannot be modified.
            </p>
          )}
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-role-desc">Description (optional)</Label>
          <Input
            id="edit-role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Role description"
            maxLength={255}
          />
        </div>
      </form>
    </AppModal>
  );
}
