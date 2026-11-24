import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { companyBrainApi } from '../api/companyBrainApi';
import type { IUpdateCompanyBrainPayload } from '../types/companyBrain.types';

export function useCompanyBrain(workspaceId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.companyBrain.detail(workspaceId ?? ''),
    queryFn: companyBrainApi.getProfile,
    enabled: Boolean(workspaceId),
  });
}

export function useSaveCompanyBrain(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IUpdateCompanyBrainPayload) => companyBrainApi.saveProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(QUERY_KEYS.companyBrain.detail(workspaceId), profile);
      toast.success(
        profile.status === 'confirmed' ? 'Company Brain confirmed.' : 'Company Brain draft saved.'
      );
    },
  });
}

export function useExtractCompanyBrainPdf() {
  return useMutation({
    mutationFn: companyBrainApi.extractFromPdf,
  });
}
