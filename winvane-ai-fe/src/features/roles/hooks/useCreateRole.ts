import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { rolesApi } from '../api/rolesApi';
import type { ICreateRolePayload } from '../types/roles.types';

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateRolePayload) => rolesApi.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members.all });
    },
  });
}

