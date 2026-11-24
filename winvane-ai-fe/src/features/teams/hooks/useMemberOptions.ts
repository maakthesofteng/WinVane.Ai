import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { teamsApi } from '../api/teamsApi';
import type { IMemberOptionsQueryParams } from '../types/teams.types';

export function useMemberOptions(params: IMemberOptionsQueryParams, enabled = true) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.teams.memberOptions(params.pool, params.search),
      params.teamId,
      params.limit,
    ],
    queryFn: () => teamsApi.getMemberOptions(params),
    enabled,
  });
}

