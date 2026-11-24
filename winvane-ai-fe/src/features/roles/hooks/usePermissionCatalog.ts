import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { rolesApi } from '../api/rolesApi';

export function usePermissionCatalog() {
  return useQuery({
    queryKey: QUERY_KEYS.permissions.catalog(),
    queryFn: () => rolesApi.getPermissionsCatalog(),
  });
}

