import { useMutation } from '@tanstack/react-query';
import { invitationsApi } from '../api/invitationsApi';
import type { IAcceptInvitationPayload } from '../types/members.types';

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (payload: IAcceptInvitationPayload) =>
      invitationsApi.acceptInvitation(payload),
  });
}

