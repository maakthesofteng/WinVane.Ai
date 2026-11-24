'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AppModal } from '@/components/common/AppModal';
import type { ISelectOption } from '@/components/common/select.types';
import { teamFormSchema, type TTeamFormValues } from '../schemas/teamForm.schema';
import { TeamFormFields } from './TeamFormFields';
import { useCreateTeam } from '../hooks/useCreateTeam';
import { useUpdateTeam } from '../hooks/useUpdateTeam';
import { buildUpdatePayload, mapServerError } from '../utils/teamForm.helpers';
import type { ITeamCard, ITeamDetail, ITeamPerson } from '../types/teams.types';

export interface ITeamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: ITeamDetail | ITeamCard | null;
  onSuccess?: (team: ITeamDetail) => void;
}

function personToOption(p: ITeamPerson): ISelectOption {
  const isInactive = p.status === 'inactive';
  return {
    value: p.userId,
    label: p.fullName,
    description: p.email,
    badge: isInactive ? `${p.roleName} (Inactive)` : p.roleName,
    avatarText: p.fullName.slice(0, 2).toUpperCase(),
  };
}

export function TeamFormModal({
  open,
  onOpenChange,
  team,
  onSuccess,
}: ITeamFormModalProps) {
  const isEdit = Boolean(team);
  const [rootError, setRootError] = React.useState<string | null>(null);

  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const isSaving = createTeam.isPending || updateTeam.isPending;

  const currentMembers = React.useMemo(() => {
    if (!team) return [];
    return 'members' in team && team.members ? team.members : team.membersPreview || [];
  }, [team]);

  const defaultValues: TTeamFormValues = React.useMemo(() => {
    if (!team) {
      return {
        name: '',
        departmentId: null,
        description: '',
        adminUserId: null,
        managerUserId: null,
        memberUserIds: [],
      };
    }
    return {
      name: team.name,
      departmentId: team.department?.id || null,
      description: team.description || '',
      adminUserId: team.admin?.userId || null,
      managerUserId: team.manager?.userId || null,
      memberUserIds: currentMembers.map((m) => m.userId),
    };
  }, [team, currentMembers]);

  const form = useForm<TTeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { isDirty },
  } = form;

  React.useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const initialAdminOption = team?.admin ? personToOption(team.admin) : undefined;
  const initialManagerOption = team?.manager ? personToOption(team.manager) : undefined;
  const initialMemberOptions = currentMembers.map(personToOption);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRootError(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: TTeamFormValues) => {
    setRootError(null);
    try {
      if (isEdit && team) {
        const payload = buildUpdatePayload(values, team);
        const updated = await updateTeam.mutateAsync({ id: team.id, payload });
        toast.success('Team updated successfully');
        onSuccess?.(updated);
      } else {
        const created = await createTeam.mutateAsync({
          name: values.name,
          departmentId: values.departmentId || null,
          description: values.description || null,
          adminUserId: values.adminUserId || null,
          managerUserId: values.managerUserId || null,
          memberUserIds: values.memberUserIds || [],
        });
        toast.success('Team created successfully');
        onSuccess?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      mapServerError(err, setError, setRootError);
    }
  };

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      size="lg"
      title={isEdit ? 'Edit team' : 'Create team'}
      description="Group your people for delivery and capacity planning."
      isDirty={isDirty}
      preventCloseWhileLoading
      primaryAction={{
        label: isEdit ? 'Save changes' : 'Create team',
        onClick: handleSubmit(onSubmit),
        loading: isSaving,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => handleOpenChange(false),
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <TeamFormFields
          form={form}
          teamId={team?.id}
          initialAdminOption={initialAdminOption}
          initialManagerOption={initialManagerOption}
          initialMemberOptions={initialMemberOptions}
          rootError={rootError}
        />
      </form>
    </AppModal>
  );
}
