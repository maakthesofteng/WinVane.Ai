import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { rolesApi } from '../api/rolesApi';
import type { IRoleSummary, IUpdateRolePermissionsPayload } from '../types/roles.types';

export function useUpdateRolePermissions(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['roles', 'permissions', id],
    mutationFn: (payload: IUpdateRolePermissionsPayload) =>
      rolesApi.updateRolePermissions(id, payload),
    onSuccess: (updatedRole: IRoleSummary) => {
      queryClient.setQueryData<IRoleSummary[]>(QUERY_KEYS.roles.all, (old) => {
        if (!old) return old;
        return old.map((r) => (r.id === id ? updatedRole : r));
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members.all });
    },
  });
}

