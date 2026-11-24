'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import type { ISelectOption } from '@/components/common/select.types';
import { selectHasPermission } from '@/store/slices/authSlice';
import { useAssignableRoles } from '../hooks/useAssignableRoles';
import { teamsApi } from '@/features/teams/api/teamsApi';

export interface IMembersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedRole?: string;
  onRoleChange: (roleId?: string) => void;
  selectedStatus?: string;
  onStatusChange: (status?: string) => void;
  selectedTeam?: string;
  onTeamChange?: (teamId?: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onAddMember: () => void;
}

export function MembersToolbar({
  search,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  selectedTeam,
  onTeamChange,
  hasActiveFilters,
  onClearFilters,
  onAddMember,
}: IMembersToolbarProps) {
  const canInvite = useSelector(selectHasPermission('members:invite'));
  const { data: roles = [] } = useAssignableRoles();

  const roleOptions = React.useMemo(() => {
    const list = roles.map((r) => ({
      value: r.id,
      label: r.name,
      description: r.description,
    }));
    return [{ value: 'all', label: 'All roles' }, ...list];
  }, [roles]);

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'invited', label: 'Invited' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const loadTeamOptions = React.useCallback(async (searchQuery: string): Promise<ISelectOption[]> => {
    const res = await teamsApi.getTeams({ search: searchQuery || undefined, pageSize: 20 });
    return res.items.map((t) => ({
      value: t.id,
      label: t.name,
      description: t.department ? t.department.name : undefined,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name or email..."
            className="pl-8 text-sm"
          />
        </div>

        {/* Role Filter */}
        <div className="w-[150px]">
          <SearchableSelect
            options={roleOptions}
            value={selectedRole || 'all'}
            onChange={(val?: string) => onRoleChange(val === 'all' ? undefined : val)}
            placeholder="Role"
          />
        </div>

        {/* Status Filter */}
        <div className="w-[140px]">
          <SearchableSelect
            options={statusOptions}
            value={selectedStatus || 'all'}
            onChange={(val?: string) => onStatusChange(val === 'all' ? undefined : val)}
            placeholder="Status"
          />
        </div>

        {/* Team Filter */}
        <div className="w-[160px]">
          <SearchableSelect
            loadOptions={loadTeamOptions}
            value={selectedTeam}
            onChange={(val?: string) => onTeamChange?.(val)}
            placeholder="All teams"
            searchPlaceholder="Search teams..."
            clearable
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Add Member button */}
      {canInvite && (
        <Button onClick={onAddMember} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      )}
    </div>
  );
}
