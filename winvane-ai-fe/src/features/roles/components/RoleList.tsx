'use client';

import * as React from 'react';
import { Info, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleListItem } from './RoleListItem';
import type { IRoleSummary } from '../types/roles.types';

export interface IRoleListProps {
  roles: IRoleSummary[];
  selectedRoleId: string | null;
  currentUserRole?: string | null;
  isLoading?: boolean;
  onSelectRole: (roleId: string) => void;
}

export function RoleList({
  roles,
  selectedRoleId,
  currentUserRole,
  isLoading = false,
  onSelectRole,
}: IRoleListProps) {
  if (isLoading) {
    return (
      <div className="w-full lg:w-[280px] shrink-0 space-y-3">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[280px] shrink-0 space-y-3">
      {/* Static Owner note */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <div>
          <span className="font-semibold text-foreground">Owner</span> — full access to
          everything (not editable).
        </div>
      </div>

      {/* Role list items */}
      <div className="space-y-2" role="list" aria-label="Workspace roles">
        {roles.map((role) => {
          const isSelected = role.id === selectedRoleId;
          const isCurrentUserRole =
            Boolean(currentUserRole) &&
            (role.systemKey?.toLowerCase() === currentUserRole?.toLowerCase() ||
              role.name.toLowerCase() === currentUserRole?.toLowerCase());

          return (
            <RoleListItem
              key={role.id}
              role={role}
              isSelected={isSelected}
              isCurrentUserRole={isCurrentUserRole}
              onSelect={() => onSelectRole(role.id)}
            />
          );
        })}

        {roles.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
            <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
            No roles available.
          </div>
        )}
      </div>
    </div>
  );
}

