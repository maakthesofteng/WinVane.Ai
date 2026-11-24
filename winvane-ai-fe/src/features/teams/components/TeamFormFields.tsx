'use client';

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchableMultiSelect } from '@/components/common/SearchableMultiSelect';
import type { ISelectOption } from '@/components/common/select.types';
import { DepartmentSelect } from './DepartmentSelect';
import { TeamLeadershipField } from './TeamLeadershipField';
import { teamsApi } from '../api/teamsApi';
import type { TTeamFormValues } from '../schemas/teamForm.schema';
import type { IMemberOption } from '../types/teams.types';

export interface ITeamFormFieldsProps {
  form: UseFormReturn<TTeamFormValues>;
  teamId?: string;
  initialAdminOption?: ISelectOption;
  initialManagerOption?: ISelectOption;
  initialMemberOptions?: ISelectOption[];
  rootError?: string | null;
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

export function TeamFormFields({
  form,
  teamId,
  initialAdminOption,
  initialManagerOption,
  initialMemberOptions = [],
  rootError,
}: ITeamFormFieldsProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const departmentIdValue = watch('departmentId') || undefined;
  const descriptionValue = watch('description') || '';
  const adminUserIdValue = watch('adminUserId') || undefined;
  const managerUserIdValue = watch('managerUserId') || undefined;
  const memberUserIdsValue = watch('memberUserIds') || [];

  const [membersEmpty, setMembersEmpty] = React.useState(false);

  const loadMemberOptions = React.useCallback(
    async (search: string): Promise<ISelectOption[]> => {
      const res = await teamsApi.getMemberOptions({
        pool: 'member',
        search: search || undefined,
        teamId,
      });
      if (!search && res.length === 0) setMembersEmpty(true);
      return res.map(mapMemberToOption);
    },
    [teamId],
  );

  return (
    <div className="space-y-4 py-1">
      {rootError && (
        <Alert variant="destructive" className="py-2.5">
          <AlertDescription>{rootError}</AlertDescription>
        </Alert>
      )}

      {/* Team Name */}
      <div className="space-y-1.5">
        <Label htmlFor="team-name" className="text-xs font-medium">
          Team name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="team-name"
          placeholder="e.g. Core Engineering"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Department */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Department</Label>
        <DepartmentSelect
          value={departmentIdValue}
          onChange={(val) => setValue('departmentId', val || null, { shouldDirty: true })}
          mode="form"
        />
        {errors.departmentId && (
          <p className="text-xs text-destructive">{errors.departmentId.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="team-description" className="text-xs font-medium">
            Description
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {descriptionValue.length}/500
          </span>
        </div>
        <textarea
          id="team-description"
          rows={3}
          placeholder="Brief description of the team's mission or responsibilities..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={500}
          value={descriptionValue}
          onChange={(e) =>
            setValue('description', e.target.value, { shouldDirty: true, shouldValidate: true })
          }
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Team Admin */}
      <TeamLeadershipField
        label="Team Admin"
        roleName="Admin"
        pool="admin"
        value={adminUserIdValue}
        onChange={(val) =>
          setValue('adminUserId', val, { shouldDirty: true, shouldValidate: true })
        }
        selectedOption={initialAdminOption}
        teamId={teamId}
        error={errors.adminUserId?.message}
      />

      {/* Team Manager */}
      <TeamLeadershipField
        label="Team Manager"
        roleName="Manager"
        pool="manager"
        value={managerUserIdValue}
        onChange={(val) =>
          setValue('managerUserId', val, { shouldDirty: true, shouldValidate: true })
        }
        selectedOption={initialManagerOption}
        teamId={teamId}
        error={errors.managerUserId?.message}
      />

      {/* Team Members */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Team Members</Label>
        <SearchableMultiSelect
          value={memberUserIdsValue}
          onChange={(val) =>
            setValue('memberUserIds', val, { shouldDirty: true, shouldValidate: true })
          }
          loadOptions={loadMemberOptions}
          selectedOptions={initialMemberOptions}
          placeholder="Add team members..."
          searchPlaceholder="Search active members..."
        />
        <p className="text-[11px] text-muted-foreground">
          Only active members with the Member role (or custom roles) are listed.
        </p>
        {membersEmpty && (
          <p className="text-[11px] text-muted-foreground">
            No active Members yet —{' '}
            <a href="/teams?tab=members" className="text-primary underline">
              invite people from the Members tab
            </a>
          </p>
        )}
        {errors.memberUserIds && (
          <p className="text-xs text-destructive">{errors.memberUserIds.message}</p>
        )}
      </div>
    </div>
  );
}
