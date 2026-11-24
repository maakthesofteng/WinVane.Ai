'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectWorkspace } from '@/store/slices/authSlice';
import { CompanyBrainForm } from '@/features/company-brain/components/CompanyBrainForm';
import {
  useCompanyBrain,
  useExtractCompanyBrainPdf,
  useSaveCompanyBrain,
} from '@/features/company-brain/hooks/useCompanyBrain';
import type { IUpdateCompanyBrainPayload } from '@/features/company-brain/types/companyBrain.types';

export default function CompanyBrainPage() {
  const user = useSelector(selectCurrentUser);
  const workspace = useSelector(selectWorkspace);
  const workspaceId = workspace?.id;
  const profileQuery = useCompanyBrain(workspaceId);
  const saveMutation = useSaveCompanyBrain(workspaceId ?? '');
  const extractMutation = useExtractCompanyBrainPdf();
  const canEdit = Boolean(user?.permissions?.includes('workspace:update'));

  const handleSave = (payload: IUpdateCompanyBrainPayload) => {
    saveMutation.mutate(payload);
  };

  const handleExtract = (file: File) => extractMutation.mutateAsync(file);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Brain"
        description="Build the company profile WinVane.ai uses to understand your capabilities and track record."
      />
      {profileQuery.isLoading && (
        <p role="status" className="text-muted-foreground text-sm">
          Loading your Company Brain…
        </p>
      )}
      {profileQuery.isError && (
        <p role="alert" className="text-destructive text-sm">
          {profileQuery.error instanceof Error
            ? profileQuery.error.message
            : 'Could not load your Company Brain. Please try again.'}
        </p>
      )}
      {profileQuery.data && (
        <CompanyBrainForm
          key={`${profileQuery.data.version}:${profileQuery.data.updatedAt ?? 'new'}`}
          profile={profileQuery.data}
          canEdit={canEdit}
          isSaving={saveMutation.isPending}
          isExtracting={extractMutation.isPending}
          saveError={
            saveMutation.isError
              ? saveMutation.error instanceof Error
                ? saveMutation.error.message
                : 'Could not save your Company Brain. Please try again.'
              : undefined
          }
          onSave={handleSave}
          onExtract={handleExtract}
        />
      )}
    </div>
  );
}
