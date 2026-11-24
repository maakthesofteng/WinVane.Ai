'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { selectHasPermission } from '@/store/slices/authSlice';
import { DepartmentSelect } from './DepartmentSelect';

export interface ITeamsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedDepartment?: string;
  onDepartmentChange: (departmentId?: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'createdAt' | 'memberCount', sortDir: 'asc' | 'desc') => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreateTeam: () => void;
}

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'createdAt_desc', label: 'Newest' },
  { value: 'memberCount_desc', label: 'Most members' },
];

export function TeamsToolbar({
  search,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  sortBy = 'name',
  sortDir = 'asc',
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  onCreateTeam,
}: ITeamsToolbarProps) {
  const canCreate = useSelector(selectHasPermission('teams:create'));

  const currentSortKey = `${sortBy}_${sortDir}`;

  const handleSortSelect = (val?: string) => {
    if (val === 'createdAt_desc') {
      onSortChange('createdAt', 'desc');
    } else if (val === 'memberCount_desc') {
      onSortChange('memberCount', 'desc');
    } else {
      onSortChange('name', 'asc');
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search teams..."
            className="pl-8 text-sm"
          />
        </div>

        {/* Department Filter */}
        <div className="w-[170px]">
          <DepartmentSelect
            value={selectedDepartment}
            onChange={onDepartmentChange}
            mode="filter"
            placeholder="All departments"
          />
        </div>

        {/* Sort */}
        <div className="w-[160px]">
          <SearchableSelect
            options={SORT_OPTIONS}
            value={currentSortKey}
            onChange={handleSortSelect}
            placeholder="Sort by"
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
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {canCreate && (
        <Button onClick={onCreateTeam} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Create team
        </Button>
      )}
    </div>
  );
}

