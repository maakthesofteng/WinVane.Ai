import { isAxiosError } from 'axios';
import type { UseFormSetError } from 'react-hook-form';
import type { TTeamFormValues } from '../schemas/teamForm.schema';
import type { ITeamCard, ITeamDetail, IUpdateTeamPayload } from '../types/teams.types';

export function buildUpdatePayload(
  values: TTeamFormValues,
  team: ITeamDetail | ITeamCard,
): IUpdateTeamPayload {
  const payload: IUpdateTeamPayload = {};

  if (values.name !== team.name) {
    payload.name = values.name;
  }
  if ((values.description || null) !== (team.description || null)) {
    payload.description = values.description || null;
  }
  if ((values.departmentId || null) !== (team.department?.id || null)) {
    payload.departmentId = values.departmentId || null;
  }
  if ((values.adminUserId || null) !== (team.admin?.userId || null)) {
    payload.adminUserId = values.adminUserId || null;
  }
  if ((values.managerUserId || null) !== (team.manager?.userId || null)) {
    payload.managerUserId = values.managerUserId || null;
  }

  const currentMembers = 'members' in team && team.members ? team.members : team.membersPreview || [];
  const currentIds = currentMembers.map((m) => m.userId).sort().join(',');
  const nextIds = [...(values.memberUserIds || [])].sort().join(',');

  if (currentIds !== nextIds) {
    payload.memberUserIds = values.memberUserIds;
  }

  return payload;
}

export function mapServerError(
  err: unknown,
  setError: UseFormSetError<TTeamFormValues>,
  setRootError: (msg: string | null) => void,
) {
  if (isAxiosError(err)) {
    const data = err.response?.data as { code?: string; message?: string | string[] } | undefined;
    const code = data?.code;
    const message = Array.isArray(data?.message) ? data?.message.join(', ') : data?.message;

    if (code === 'TEAM_NAME_TAKEN') {
      setError('name', { message: 'A team with this name already exists in this workspace.' });
      return;
    }
    if (code === 'TEAM_ADMIN_ROLE_REQUIRED') {
      setError('adminUserId', { message: 'Team Admin must have the Admin role.' });
      return;
    }
    if (code === 'TEAM_MANAGER_ROLE_REQUIRED') {
      setError('managerUserId', { message: 'Team Manager must have the Manager role.' });
      return;
    }
    if (
      code === 'TEAM_MEMBER_ROLE_INVALID' ||
      code === 'TEAM_MEMBER_NOT_ACTIVE' ||
      code === 'TEAM_MEMBER_INVALID'
    ) {
      setError('memberUserIds', { message: message || 'Invalid team member selected.' });
      return;
    }
    if (code === 'TEAM_EMPTY') {
      setRootError('A team must have at least one person.');
      return;
    }
    setRootError(message || 'An error occurred while saving the team.');
    return;
  }
  setRootError('An unexpected error occurred.');
}

