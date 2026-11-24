import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { membersApi } from '../api/membersApi';
import type { IMembersQueryParams } from '../types/members.types';

export function useMembersList(params: IMembersQueryParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.members.list(params),
    queryFn: () => membersApi.getMembers(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

