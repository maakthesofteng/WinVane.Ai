import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { teamsApi } from '../api/teamsApi';
import type { ITeamsQueryParams } from '../types/teams.types';

export function useTeamsList(params: ITeamsQueryParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.teams.list(params),
    queryFn: () => teamsApi.getTeams(params),
  });
}

