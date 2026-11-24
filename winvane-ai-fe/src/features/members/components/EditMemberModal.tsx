'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import { AppModal } from '@/components/common/AppModal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { useUpdateMember } from '../hooks/useUpdateMember';
import { useRoleChangeImpact } from '../hooks/useRoleChangeImpact';
import {
  editMemberSchema,
  type TEditMemberFormValues,
} from '../schemas/memberForm.schema';
import { MemberFormFields, type IMemberFormData } from './MemberFormFields';
import { TeamChips } from './TeamChips';
import { ApiError } from '@/lib/api/apiError';
import type { IMemberRow } from '../types/members.types';

export interface IEditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: IMemberRow | null;
}

export function EditMemberModal({
  open,
  onOpenChange,
  member,
}: IEditMemberModalProps) {
  const confirm = useConfirm();
  const [formAlert, setFormAlert] = React.useState<string | null>(null);

  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember();
  const { mutateAsync: checkImpact, isPending: isCheckingImpact } = useRoleChangeImpact();

  const form = useForm<TEditMemberFormValues>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: { fullName: '', email: '', phone: null, jobTitle: '', roleId: '' },
  });

  const { handleSubmit, reset, setError, formState: { isDirty } } = form;

  React.useEffect(() => {
    if (open && member) {
      reset({
        fullName: member.fullName,
        email: member.email,
        phone: member.phone || null,
        jobTitle: member.jobTitle || '',
        roleId: member.role.id,
      });
    }
  }, [open, member, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setFormAlert(null);
    onOpenChange(nextOpen);
  };

  if (!member) return null;

  const executeUpdate = (values: TEditMemberFormValues) => {
    const payload: Record<string, string | null> = {};
    if (values.fullName.trim() !== member.fullName) payload.fullName = values.fullName.trim();
    if ((values.phone || null) !== member.phone) payload.phone = values.phone || null;
    if ((values.jobTitle?.trim() || null) !== member.jobTitle) payload.jobTitle = values.jobTitle?.trim() || null;
    if (values.roleId !== member.role.id) payload.roleId = values.roleId;

    updateMember(
      { id: member.id, payload },
      {
        onSuccess: (data) => {
          if (data.removedFromTeams && data.removedFromTeams.length > 0) {
            toast.success(`Member updated. Removed from ${data.removedFromTeams.length} incompatible team slot(s).`);
          } else {
            toast.success('Member updated successfully.');
          }
          handleOpenChange(false);
        },
        onError: (err: unknown) => {
          const apiErr = err instanceof ApiError ? err : null;
          if (apiErr?.code === 'ROLE_NOT_ASSIGNABLE') {
            setError('roleId', { message: 'You do not have permission to assign this role.' });
          } else if (apiErr?.code === 'OWNER_IMMUTABLE') {
            setFormAlert('The workspace owner cannot be modified.');
          } else if (apiErr?.code === 'CANNOT_CHANGE_OWN_ROLE') {
            setError('roleId', { message: "You can't change your own role." });
          } else {
            setFormAlert(apiErr?.messages.join('. ') || (err instanceof Error ? err.message : 'Failed to update member.'));
          }
        },
      }
    );
  };

  const onSubmit = async (values: TEditMemberFormValues) => {
    setFormAlert(null);

    // If role changed, dry-run impact preview first
    if (values.roleId !== member.role.id) {
      try {
        const impact = await checkImpact({ memberId: member.id, roleId: values.roleId });
        if (impact.removedFromTeams && impact.removedFromTeams.length > 0) {
          const teamList = impact.removedFromTeams
            .map((t) => `${t.name} (${t.teamRole})`)
            .join(', ');
          const ok = await confirm({
            title: 'Role change will remove team memberships',
            description: `Changing ${member.fullName}'s role removes them from: ${teamList}. Continue?`,
            confirmLabel: 'Update role and remove slots',
            variant: 'destructive',
          });
          if (!ok) return;
        }
      } catch {
        // Swallowed: proceed with update attempt
      }
    }

    executeUpdate(values);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      size="md"
      title="Edit member"
      description="Update profile details or modify workspace role assignment."
      isDirty={isDirty}
      primaryAction={{
        label: 'Save changes',
        loading: isUpdating || isCheckingImpact,
        onClick: handleSubmit(onSubmit),
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => handleOpenChange(false),
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formAlert && <FormErrorAlert error={formAlert} />}

        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <span className="text-xs text-muted-foreground font-medium">Account status:</span>
          <StatusBadge status={member.status} />
        </div>

        <MemberFormFields form={form as unknown as UseFormReturn<IMemberFormData>} isEditMode={true} isSelf={member.isSelf} />

        {/* Read-only Teams section */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Current Teams</span>
            <Link
              href="/teams?tab=teams"
              onClick={() => handleOpenChange(false)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Manage teams <ExternalLink className="size-3" />
            </Link>
          </div>
          <TeamChips teams={member.teams} />
        </div>
      </form>
    </AppModal>
  );
}
