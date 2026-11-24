import { apiClient } from '@/lib/api/apiClient';
import type { IPaginated } from '@/types/api.types';
import type {
  IInviteMemberPayload,
  IMemberEditResult,
  IMemberRow,
  IMembersQueryParams,
  IRoleChangeImpact,
  IRoleOption,
  IUpdateMemberPayload,
} from '../types/members.types';

export const membersApi = {
  async getMembers(params: IMembersQueryParams = {}): Promise<IPaginated<IMemberRow>> {
    const response = await apiClient.get<IPaginated<IMemberRow>>('/members', { params });
    return response.data;
  },

  async getAssignableRoles(): Promise<IRoleOption[]> {
    const response = await apiClient.get<IRoleOption[]>('/members/assignable-roles');
    return response.data;
  },

  async inviteMember(payload: IInviteMemberPayload): Promise<IMemberRow> {
    const response = await apiClient.post<IMemberRow>('/members', payload);
    return response.data;
  },

  async updateMember(id: string, payload: IUpdateMemberPayload): Promise<IMemberEditResult> {
    const response = await apiClient.patch<IMemberEditResult>(`/members/${id}`, payload);
    return response.data;
  },

  async getRoleChangeImpact(id: string, roleId: string): Promise<IRoleChangeImpact> {
    const response = await apiClient.get<IRoleChangeImpact>(`/members/${id}/role-change-impact`, {
      params: { roleId },
    });
    return response.data;
  },

  async resendInvite(id: string): Promise<IMemberRow> {
    const response = await apiClient.post<IMemberRow>(`/members/${id}/resend-invite`);
    return response.data;
  },

  async revokeInvite(id: string): Promise<IMemberRow> {
    const response = await apiClient.post<IMemberRow>(`/members/${id}/revoke-invite`);
    return response.data;
  },

  async deactivateMember(id: string): Promise<IMemberRow> {
    const response = await apiClient.post<IMemberRow>(`/members/${id}/deactivate`);
    return response.data;
  },

  async reactivateMember(id: string): Promise<IMemberRow> {
    const response = await apiClient.post<IMemberRow>(`/members/${id}/reactivate`);
    return response.data;
  },
};

