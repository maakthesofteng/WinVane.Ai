import { useQuery } from '@tanstack/react-query';
import { invitationsApi } from '../api/invitationsApi';

export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: ['invitation', 'validate', token],
    queryFn: () => invitationsApi.validateInvitation(token),
    enabled: Boolean(token && token.trim().length > 0),
    retry: false,
    staleTime: 0,
  });
}

