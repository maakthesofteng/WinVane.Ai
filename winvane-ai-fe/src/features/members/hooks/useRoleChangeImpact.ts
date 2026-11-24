import { useMutation } from '@tanstack/react-query';
import { membersApi } from '../api/membersApi';

export function useRoleChangeImpact() {
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      membersApi.getRoleChangeImpact(memberId, roleId),
  });
}

