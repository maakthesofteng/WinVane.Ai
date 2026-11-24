import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { rolesApi } from '../api/rolesApi';

export function useRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.roles.list(),
    queryFn: () => rolesApi.getRoles(),
  });
}

