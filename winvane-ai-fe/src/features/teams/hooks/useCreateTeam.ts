import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { teamsApi } from '../api/teamsApi';
import type { ICreateTeamPayload } from '../types/teams.types';

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateTeamPayload) => teamsApi.createTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
    },
  });
}

