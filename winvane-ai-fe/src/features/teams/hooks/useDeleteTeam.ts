import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { teamsApi } from '../api/teamsApi';

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamsApi.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.departments.all });
    },
  });
}

