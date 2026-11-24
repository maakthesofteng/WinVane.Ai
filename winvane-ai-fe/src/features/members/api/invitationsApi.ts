import { apiClient } from '@/lib/api/apiClient';
import type {
  IAcceptInvitationPayload,
  IAcceptInvitationResponse,
  IInvitationDetails,
} from '../types/members.types';

export const invitationsApi = {
  async validateInvitation(token: string): Promise<IInvitationDetails> {
    const response = await apiClient.get<IInvitationDetails>('/invitations/validate', {
      params: { token },
    });
    return response.data;
  },

  async acceptInvitation(
    payload: IAcceptInvitationPayload
  ): Promise<IAcceptInvitationResponse> {
    const response = await apiClient.post<IAcceptInvitationResponse>(
      '/invitations/accept',
      payload
    );
    return response.data;
  },
};

