'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { ApiError } from '@/lib/api/apiError';
import { RoleHeader } from './RoleHeader';
import { PermissionEditor } from './PermissionEditor';
import { UnsavedChangesBar } from './UnsavedChangesBar';
import { EditRoleDetailsModal } from './EditRoleDetailsModal';
import { useUpdateRolePermissions } from '../hooks/useUpdateRolePermissions';
import { useDeleteRole } from '../hooks/useDeleteRole';
import { applyReadDependency, calculatePermissionChanges, toggleGroupKeys } from '../utils/permissionDiff';
import type { IPermissionGroup, IRoleSummary } from '../types/roles.types';

export interface IRoleDetailPanelProps {
  role: IRoleSummary;
  permissionGroups: IPermissionGroup[];
  grantableKeys: string[];
  currentUserRole?: string | null;
  canManageRoles: boolean;
  isMobileView?: boolean;
  onBackToList?: () => void;
  onRoleUpdated: (role: IRoleSummary) => void;
  onRoleDeleted: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function RoleDetailPanel({
  role,
  permissionGroups,
  grantableKeys,
  currentUserRole,
  canManageRoles,
  isMobileView = false,
  onBackToList,
  onRoleUpdated,
  onRoleDeleted,
  onDirtyChange,
}: IRoleDetailPanelProps) {
  const [draftKeys, setDraftKeys] = React.useState<string[]>(role.permissionKeys);
  const [autoAddedReadNote, setAutoAddedReadNote] = React.useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [prevRolePermissionKeys, setPrevRolePermissionKeys] = React.useState<string[]>(role.permissionKeys);

  if (role.permissionKeys !== prevRolePermissionKeys) {
    setPrevRolePermissionKeys(role.permissionKeys);
    setDraftKeys(role.permissionKeys);
  }

  const confirm = useConfirm();
  const updatePermissionsMutation = useUpdateRolePermissions(role.id);
  const deleteRoleMutation = useDeleteRole();

  const { totalChanges } = React.useMemo(
    () => calculatePermissionChanges(role.permissionKeys, draftKeys),
    [role.permissionKeys, draftKeys]
  );
  const isDirty = totalChanges > 0;

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleTogglePermission = (group: IPermissionGroup, key: string, nextChecked: boolean) => {
    if (!role.canEdit) return;
    if (nextChecked) {
      const { updatedKeys, autoAddedRead } = applyReadDependency(group, draftKeys, key);
      setDraftKeys(updatedKeys);
      if (autoAddedRead) {
        setAutoAddedReadNote('View access added automatically.');
        setTimeout(() => setAutoAddedReadNote(null), 4000);
      }
    } else {
      setDraftKeys(draftKeys.filter((k) => k !== key));
    }
  };

  const handleToggleGroup = (group: IPermissionGroup) => {
    if (!role.canEdit) return;
    const { updatedKeys, autoAddedRead } = toggleGroupKeys(group, draftKeys, grantableKeys, role.canEdit);
    setDraftKeys(updatedKeys);
    if (autoAddedRead) {
      setAutoAddedReadNote('View access added automatically.');
      setTimeout(() => setAutoAddedReadNote(null), 4000);
    }
  };

  const handleSave = async () => {
    try {
      const updated = await updatePermissionsMutation.mutateAsync({ permissionKeys: draftKeys });
      setDraftKeys(updated.permissionKeys);
      toast.success(`Permissions updated for ${role.name}. Changes apply on members' next action.`);
      onRoleUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update permissions.');
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete role ${role.name}?`,
      description: `Are you sure you want to delete "${role.name}"? This cannot be undone.`,
      confirmLabel: 'Delete role',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteRoleMutation.mutateAsync(role.id);
      toast.success(`Role "${role.name}" deleted.`);
      onRoleDeleted();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ROLE_IN_USE') {
        toast.error(`Cannot delete role: ${role.userCount} members are still assigned to it.`);
        return;
      }
      toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to delete role.');
    }
  };

  const isCurrentUserRole = Boolean(currentUserRole) &&
    (role.systemKey?.toLowerCase() === currentUserRole?.toLowerCase() ||
     role.name.toLowerCase() === currentUserRole?.toLowerCase());

  const readOnlyReason = isCurrentUserRole
    ? "You cannot edit permissions for your own role."
    : !canManageRoles
      ? "You do not have permission to manage workspace roles."
      : "You do not have permission to edit this role.";

  return (
    <div className="flex-1 min-w-0 space-y-6 pb-20">
      {isMobileView && onBackToList && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={async () => {
            if (isDirty) {
              const discard = await confirm({
                title: 'Discard unsaved changes?',
                description: 'You have unsaved permission changes that will be lost.',
                confirmLabel: 'Discard',
                variant: 'destructive',
              });
              if (!discard) return;
            }
            onBackToList();
          }}
          className="text-xs -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to roles
        </Button>
      )}

      <RoleHeader
        role={role}
        canManageRoles={canManageRoles}
        onEditDetails={() => setEditModalOpen(true)}
        onDelete={handleDelete}
      />

      <PermissionEditor
        groups={permissionGroups}
        selectedKeys={draftKeys}
        grantableKeys={grantableKeys}
        canEdit={role.canEdit}
        readOnlyReason={readOnlyReason}
        autoAddedReadNote={autoAddedReadNote}
        onTogglePermission={handleTogglePermission}
        onToggleGroup={handleToggleGroup}
      />

      <UnsavedChangesBar
        changeCount={totalChanges}
        isSaving={updatePermissionsMutation.isPending}
        onDiscard={() => {
          setDraftKeys(role.permissionKeys);
          setAutoAddedReadNote(null);
        }}
        onSave={handleSave}
      />

      {editModalOpen && (
        <EditRoleDetailsModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          role={role}
          onUpdated={onRoleUpdated}
        />
      )}
    </div>
  );
}
