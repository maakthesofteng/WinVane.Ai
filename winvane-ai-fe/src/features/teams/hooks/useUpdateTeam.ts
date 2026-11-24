import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { teamsApi } from '../api/teamsApi';
import type { IUpdateTeamPayload } from '../types/teams.types';

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IUpdateTeamPayload }) =>
      teamsApi.updateTeam(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.detail(variables.id) });
    },
  });
}

