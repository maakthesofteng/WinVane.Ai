import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { membersApi } from '../api/membersApi';

export function useAssignableRoles() {
  return useQuery({
    queryKey: QUERY_KEYS.members.assignableRoles(),
    queryFn: () => membersApi.getAssignableRoles(),
    staleTime: 5 * 60 * 1000,
  });
}

