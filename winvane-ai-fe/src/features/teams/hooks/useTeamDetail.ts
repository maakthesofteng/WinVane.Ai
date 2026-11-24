import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { teamsApi } from '../api/teamsApi';

export function useTeamDetail(id?: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.teams.detail(id || ''),
    queryFn: () => teamsApi.getTeamById(id!),
    enabled: Boolean(id),
  });
}

