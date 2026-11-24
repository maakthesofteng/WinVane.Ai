'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionRow } from './PermissionRow';
import { getGroupSelectionState } from '../utils/permissionDiff';
import type { IPermissionGroup } from '../types/roles.types';

export interface IPermissionGroupCardProps {
  group: IPermissionGroup;
  selectedKeysSet: Set<string>;
  grantableKeysSet: Set<string>;
  canEdit: boolean;
  onTogglePermission: (group: IPermissionGroup, key: string, nextChecked: boolean) => void;
  onToggleGroup: (group: IPermissionGroup) => void;
}

export function PermissionGroupCard({
  group,
  selectedKeysSet,
  grantableKeysSet,
  canEdit,
  onTogglePermission,
  onToggleGroup,
}: IPermissionGroupCardProps) {
  const selectionState = getGroupSelectionState(group.permissions, selectedKeysSet);
  const enabledCount = group.permissions.filter((p) => selectedKeysSet.has(p.key)).length;
  const totalCount = group.permissions.length;

  // Tri-state checkbox state
  const isChecked = selectionState === 'all';
  const isIndeterminate = selectionState === 'some';

  // Toggleable keys (keys user is allowed to grant/revoke)
  const hasGrantableKeys = group.permissions.some((p) => grantableKeysSet.has(p.key));
  const isGroupDisabled = !canEdit || !hasGrantableKeys;

  const selectAllId = `select-all-${group.module}`;

  return (
    <Card className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
      {/* Group Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Checkbox
            id={selectAllId}
            checked={isChecked}
            indeterminate={isIndeterminate}
            disabled={isGroupDisabled}
            onCheckedChange={() => onToggleGroup(group)}
            aria-label={`Select all ${group.moduleLabel} permissions`}
          />
          <label
            htmlFor={selectAllId}
            className={`text-sm font-semibold text-foreground select-none ${
              isGroupDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            }`}
          >
            {group.moduleLabel}
          </label>
        </div>

        <span className="text-xs text-muted-foreground font-medium">
          {enabledCount} of {totalCount} enabled
        </span>
      </div>

      {/* Permissions list */}
      <div className="p-2 space-y-0.5">
        {group.permissions.map((perm) => {
          const isSelected = selectedKeysSet.has(perm.key);
          const isGrantable = grantableKeysSet.has(perm.key);
          const isDisabled = !canEdit || !isGrantable;

          let disableReason: string | undefined;
          if (!canEdit) {
            disableReason = undefined; // Card or panel explains canEdit
          } else if (!isGrantable) {
            disableReason =
              "You don't have this permission, so you can't grant or remove it";
          }

          return (
            <PermissionRow
              key={perm.key}
              permission={perm}
              checked={isSelected}
              disabled={isDisabled}
              disableReason={disableReason}
              onToggle={(checked) => onTogglePermission(group, perm.key, checked)}
            />
          );
        })}
      </div>
    </Card>
  );
}

