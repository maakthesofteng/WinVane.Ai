'use client';

import * as React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AppModal } from '@/components/common/AppModal';
import { FormErrorAlert } from '@/features/auth/components/FormErrorAlert';
import { useInviteMember } from '../hooks/useInviteMember';
import {
  inviteMemberSchema,
  type TInviteMemberFormValues,
} from '../schemas/memberForm.schema';
import { MemberFormFields, type IMemberFormData } from './MemberFormFields';
import { ApiError } from '@/lib/api/apiError';

export interface IInviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberModal({ open, onOpenChange }: IInviteMemberModalProps) {
  const [formAlert, setFormAlert] = React.useState<string | null>(null);
  const { mutate: inviteMember, isPending } = useInviteMember();

  const form = useForm<TInviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: null,
      jobTitle: '',
      roleId: '',
    },
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { isDirty },
  } = form;

  React.useEffect(() => {
    if (open) {
      reset({
        fullName: '',
        email: '',
        phone: null,
        jobTitle: '',
        roleId: '',
      });
    }
  }, [open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormAlert(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = (values: TInviteMemberFormValues) => {
    setFormAlert(null);

    inviteMember(
      {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone || null,
        jobTitle: values.jobTitle?.trim() || null,
        roleId: values.roleId,
      },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${values.email}`);
          handleOpenChange(false);
          reset();
        },
        onError: (err: unknown) => {
          const apiErr = err instanceof ApiError ? err : null;
          if (apiErr?.code === 'EMAIL_ALREADY_REGISTERED') {
            setError('email', {
              message: 'This email already belongs to a WinVane.ai account.',
            });
          } else if (apiErr?.code === 'ROLE_NOT_ASSIGNABLE') {
            setError('roleId', {
              message: 'You do not have permission to assign this role.',
            });
          } else if (apiErr?.statusCode === 429) {
            setFormAlert('Too many invites — try again later.');
          } else {
            const msg =
              apiErr?.messages.join('. ') ||
              (err instanceof Error ? err.message : 'Failed to send invitation.');
            setFormAlert(msg);
          }
        },
      }
    );
  };

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      size="md"
      title="Add member"
      description="We'll email them an invitation to create their account."
      isDirty={isDirty}
      primaryAction={{
        label: 'Send invite',
        loading: isPending,
        onClick: handleSubmit(onSubmit),
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => handleOpenChange(false),
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formAlert && <FormErrorAlert error={formAlert} />}
        <MemberFormFields form={form as unknown as UseFormReturn<IMemberFormData>} isEditMode={false} />
      </form>
    </AppModal>
  );
}
