import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { rolesApi } from '../api/rolesApi';

export function useRole(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.roles.detail(id ?? ''),
    queryFn: () => rolesApi.getRoleById(id!),
    enabled: Boolean(id),
  });
}

