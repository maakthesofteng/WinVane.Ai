import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query/queryKeys';
import { membersApi } from '../api/membersApi';
import type { IInviteMemberPayload } from '../types/members.types';

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IInviteMemberPayload) => membersApi.inviteMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members.all });
    },
  });
}

