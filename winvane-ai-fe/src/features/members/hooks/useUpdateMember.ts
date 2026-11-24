import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { membersApi } from '../api/membersApi';
import type { IUpdateMemberPayload } from '../types/members.types';

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IUpdateMemberPayload }) =>
      membersApi.updateMember(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members.all });
      if (data.removedFromTeams && data.removedFromTeams.length > 0) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.all });
      }
    },
  });
}

