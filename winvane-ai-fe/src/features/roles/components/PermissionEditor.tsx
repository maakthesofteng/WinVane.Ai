'use client';

import * as React from 'react';
import { Info, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PermissionGroupCard } from './PermissionGroupCard';
import type { IPermissionGroup } from '../types/roles.types';

export interface IPermissionEditorProps {
  groups: IPermissionGroup[];
  selectedKeys: string[];
  grantableKeys: string[];
  canEdit: boolean;
  readOnlyReason?: string;
  autoAddedReadNote?: string | null;
  onTogglePermission: (group: IPermissionGroup, key: string, nextChecked: boolean) => void;
  onToggleGroup: (group: IPermissionGroup) => void;
}

export function PermissionEditor({
  groups,
  selectedKeys,
  grantableKeys,
  canEdit,
  readOnlyReason,
  autoAddedReadNote,
  onTogglePermission,
  onToggleGroup,
}: IPermissionEditorProps) {
  const selectedKeysSet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const grantableKeysSet = React.useMemo(() => new Set(grantableKeys), [grantableKeys]);

  return (
    <div className="space-y-4">
      {/* Read-only banner */}
      {!canEdit && (
        <Alert className="border-border/60 bg-muted/40 text-muted-foreground flex items-center gap-3 py-3">
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <AlertDescription className="text-xs">
            {readOnlyReason ||
              'This role is read-only. You cannot modify permissions for your own role or roles you do not have permission to manage.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-added :read notification hint */}
      {autoAddedReadNote && (
        <Alert className="border-primary/30 bg-primary/5 text-primary py-2.5 px-3 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-xs font-medium">
            {autoAddedReadNote}
          </AlertDescription>
        </Alert>
      )}

      {/* Dynamic module groups in API order */}
      <div className="space-y-4">
        {groups.map((group) => (
          <PermissionGroupCard
            key={group.module}
            group={group}
            selectedKeysSet={selectedKeysSet}
            grantableKeysSet={grantableKeysSet}
            canEdit={canEdit}
            onTogglePermission={onTogglePermission}
            onToggleGroup={onToggleGroup}
          />
        ))}

        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground">
            No permissions available in catalog.
          </div>
        )}
      </div>
    </div>
  );
}

