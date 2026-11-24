import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { rolesApi } from '../api/rolesApi';
import type { IUpdateRolePayload } from '../types/roles.types';

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IUpdateRolePayload) => rolesApi.updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
    },
  });
}

