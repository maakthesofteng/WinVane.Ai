'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser, selectHasPermission } from '@/store/slices/authSlice';
import { ApiError } from '@/lib/api/apiError';
import { RoleList } from './RoleList';
import { RoleDetailPanel } from './RoleDetailPanel';
import { CreateRoleModal } from './CreateRoleModal';
import { useRoles } from '../hooks/useRoles';
import { usePermissionCatalog } from '../hooks/usePermissionCatalog';
import type { ICreateRoleResult } from '../types/roles.types';
import { cn } from '@/lib/utils/cn';

export function RolesPermissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();

  const currentUser = useAppSelector(selectCurrentUser);
  const canManageRoles = useAppSelector(selectHasPermission('roles:manage'));

  const { data: roles = [], isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const { data: catalog, error: catalogError } = usePermissionCatalog();

  const [isMobileDetailOpen, setIsMobileDetailOpen] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);

  // Sync role ID from URL or default to first role (Admin)
  const roleFromUrl = searchParams.get('role');
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);

  const activeRoleId =
    selectedRoleId && roles.some((r) => r.id === selectedRoleId)
      ? selectedRoleId
      : roleFromUrl && roles.some((r) => r.id === roleFromUrl)
        ? roleFromUrl
        : roles[0]?.id ?? null;

  const [prevRoleFromUrl, setPrevRoleFromUrl] = React.useState(roleFromUrl);
  if (roleFromUrl !== prevRoleFromUrl) {
    setPrevRoleFromUrl(roleFromUrl);
    if (roleFromUrl && roles.some((r) => r.id === roleFromUrl)) {
      setSelectedRoleId(roleFromUrl);
    }
  }

  React.useEffect(() => {
    if (!roleFromUrl && roles.length > 0) {
      router.replace(`/roles-permissions?role=${roles[0].id}`);
    }
  }, [roleFromUrl, roles, router]);

  // Window unload confirmation
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSelectRole = async (targetId: string) => {
    if (targetId === activeRoleId) {
      setIsMobileDetailOpen(true);
      return;
    }
    if (isDirty) {
      const discard = await confirm({
        title: 'Discard unsaved changes?',
        description: 'You have unsaved changes. Switching roles will discard them.',
        confirmLabel: 'Discard',
        variant: 'destructive',
      });
      if (!discard) return;
    }
    setIsDirty(false);
    setSelectedRoleId(targetId);
    setIsMobileDetailOpen(true);
    router.push(`/roles-permissions?role=${targetId}`);
  };

  const handleRoleCreated = (newRole: ICreateRoleResult) => {
    refetchRoles();
    setSelectedRoleId(newRole.id);
    setIsMobileDetailOpen(true);
    router.push(`/roles-permissions?role=${newRole.id}`);
  };

  const handleRoleDeleted = () => {
    refetchRoles();
    const fallback = roles.find((r) => r.systemKey === 'admin') ?? roles[0];
    if (fallback) {
      setSelectedRoleId(fallback.id);
      router.push(`/roles-permissions?role=${fallback.id}`);
    }
  };

  const isForbidden =
    (rolesError instanceof ApiError && rolesError.statusCode === 403) ||
    (catalogError instanceof ApiError && catalogError.statusCode === 403);

  if (isForbidden) {
    return (
      <div className="space-y-6">
        <PageHeader title="Roles & Permissions" description="Manage workspace roles and permissions." />
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <EmptyState
            icon={<ShieldAlert className="h-10 w-10 text-destructive" />}
            title="Access Denied"
            description="You do not have permission to view workspace roles and permissions."
          />
        </div>
      </div>
    );
  }

  const selectedRole = roles.find((r) => r.id === activeRoleId) ?? roles[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Control what each role can see and do in your workspace. The Owner always has full access."
        action={
          canManageRoles ? (
            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add role
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <div className={cn('w-full lg:w-[280px] shrink-0', isMobileDetailOpen ? 'hidden lg:block' : 'block')}>
          <RoleList
            roles={roles}
            selectedRoleId={selectedRole?.id ?? null}
            currentUserRole={currentUser?.role}
            isLoading={rolesLoading}
            onSelectRole={handleSelectRole}
          />
        </div>

        <div className={cn('flex-1 min-w-0 w-full', isMobileDetailOpen ? 'block' : 'hidden lg:block')}>
          {selectedRole ? (
            <RoleDetailPanel
              key={selectedRole.id}
              role={selectedRole}
              permissionGroups={catalog?.groups ?? []}
              grantableKeys={catalog?.grantableKeys ?? []}
              currentUserRole={currentUser?.role}
              canManageRoles={canManageRoles}
              isMobileView={isMobileDetailOpen}
              onBackToList={() => setIsMobileDetailOpen(false)}
              onRoleUpdated={() => refetchRoles()}
              onRoleDeleted={handleRoleDeleted}
              onDirtyChange={setIsDirty}
            />
          ) : (
            !rolesLoading && (
              <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
                <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a role to view and manage its permissions.</p>
              </div>
            )
          )}
        </div>
      </div>

      {createModalOpen && (
        <CreateRoleModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          existingRoles={roles}
          onCreated={handleRoleCreated}
        />
      )}
    </div>
  );
}
