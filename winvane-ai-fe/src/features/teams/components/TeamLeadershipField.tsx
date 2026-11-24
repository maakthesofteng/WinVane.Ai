'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import type { ISelectOption } from '@/components/common/select.types';
import { teamsApi } from '../api/teamsApi';
import type { IMemberOption } from '../types/teams.types';

export interface ITeamLeadershipFieldProps {
  label: string;
  roleName: 'Admin' | 'Manager';
  pool: 'admin' | 'manager';
  value?: string;
  onChange: (val: string | null) => void;
  selectedOption?: ISelectOption;
  teamId?: string;
  error?: string;
}

function mapMemberToOption(m: IMemberOption): ISelectOption {
  const isInactive = m.status === 'inactive';
  return {
    value: m.userId,
    label: m.fullName,
    description: m.email,
    badge: isInactive ? `${m.roleName} (Inactive)` : m.roleName,
    avatarText: m.fullName.slice(0, 2).toUpperCase(),
  };
}

export function TeamLeadershipField({
  label,
  roleName,
  pool,
  value,
  onChange,
  selectedOption,
  teamId,
  error,
}: ITeamLeadershipFieldProps) {
  const [isEmpty, setIsEmpty] = React.useState(false);

  const loadOptions = React.useCallback(
    async (search: string): Promise<ISelectOption[]> => {
      const res = await teamsApi.getMemberOptions({
        pool,
        search: search || undefined,
        teamId,
      });
      if (!search && res.length === 0) setIsEmpty(true);
      return res.map(mapMemberToOption);
    },
    [pool, teamId],
  );

  const selectedOptions = React.useMemo(() => {
    return selectedOption ? [selectedOption] : [];
  }, [selectedOption]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <SearchableSelect
        value={value}
        onChange={(val) => onChange(val || null)}
        loadOptions={loadOptions}
        selectedOptions={selectedOptions}
        placeholder={`Select a Team ${roleName}...`}
        searchPlaceholder={`Search active ${roleName}s...`}
        clearable
      />
      <p className="text-[11px] text-muted-foreground">
        Only active members with the {roleName} role are listed.
      </p>
      {isEmpty && (
        <p className="text-[11px] text-muted-foreground">
          No active {roleName}s yet —{' '}
          <a href="/teams?tab=members" className="text-primary underline">
            invite one from the Members tab
          </a>
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

