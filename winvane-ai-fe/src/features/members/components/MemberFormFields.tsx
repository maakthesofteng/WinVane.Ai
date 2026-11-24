'use client';

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/common/PhoneInput';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { useAssignableRoles } from '../hooks/useAssignableRoles';

export interface IMemberFormData {
  fullName: string;
  email?: string;
  phone?: string | null;
  jobTitle?: string | null;
  roleId: string;
}

export interface IMemberFormFieldsProps {
  form: UseFormReturn<IMemberFormData>;
  isEditMode?: boolean;
  isSelf?: boolean;
}

export function MemberFormFields({
  form,
  isEditMode = false,
  isSelf = false,
}: IMemberFormFieldsProps) {
  const { data: assignableRoles = [], isLoading: isLoadingRoles } = useAssignableRoles();

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const phoneValue = watch('phone') ?? '';
  const roleIdValue = watch('roleId') ?? '';

  const roleOptions = React.useMemo(() => {
    return assignableRoles.map((role) => ({
      value: role.id,
      label: role.name,
      description: role.description,
    }));
  }, [assignableRoles]);

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-sm font-medium">
          Full name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder="Jane Doe"
          aria-invalid={Boolean(errors.fullName)}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName.message as string}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          Email address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="jane@company.com"
          disabled={isEditMode}
          className={isEditMode ? 'bg-muted/50 cursor-not-allowed opacity-80' : ''}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {isEditMode && (
          <p className="text-[11px] text-muted-foreground">
            Email address cannot be changed after invitation.
          </p>
        )}
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message as string}</p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm font-medium">
          Phone number <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <PhoneInput
          value={phoneValue}
          onChange={(val) => setValue('phone', val || null, { shouldDirty: true, shouldValidate: true })}
          disabled={form.formState.isSubmitting}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message as string}</p>
        )}
      </div>

      {/* Job Title */}
      <div className="space-y-1.5">
        <Label htmlFor="jobTitle" className="text-sm font-medium">
          Job title <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="jobTitle"
          placeholder="e.g. Lead Designer"
          maxLength={100}
          aria-invalid={Boolean(errors.jobTitle)}
          {...register('jobTitle')}
        />
        {errors.jobTitle && (
          <p className="text-xs text-destructive">{errors.jobTitle.message as string}</p>
        )}
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label htmlFor="roleId" className="text-sm font-medium">
          Role <span className="text-destructive">*</span>
        </Label>
        <SearchableSelect
          options={roleOptions}
          value={roleIdValue}
          onChange={(val?: string) =>
            setValue('roleId', val || '', { shouldDirty: true, shouldValidate: true })
          }
          placeholder={isLoadingRoles ? 'Loading roles...' : 'Select a role'}
          disabled={isSelf || isLoadingRoles || form.formState.isSubmitting}
        />
        {isSelf && (
          <p className="text-[11px] text-muted-foreground">
            You can&apos;t change your own role.
          </p>
        )}
        {errors.roleId && (
          <p className="text-xs text-destructive">{errors.roleId.message as string}</p>
        )}
      </div>
    </div>
  );
}

