import { apiClient } from '@/lib/api/apiClient';
import type { IPaginated } from '@/types/api.types';
import type {
  ICreateTeamPayload,
  IMemberOption,
  IMemberOptionsQueryParams,
  ITeamCard,
  ITeamDetail,
  ITeamsQueryParams,
  IUpdateTeamPayload,
} from '../types/teams.types';

export const teamsApi = {
  async getTeams(params: ITeamsQueryParams = {}): Promise<IPaginated<ITeamCard>> {
    const response = await apiClient.get<IPaginated<ITeamCard>>('/teams', { params });
    return response.data;
  },

  async getTeamById(id: string): Promise<ITeamDetail> {
    const response = await apiClient.get<ITeamDetail>(`/teams/${id}`);
    return response.data;
  },

  async createTeam(payload: ICreateTeamPayload): Promise<ITeamDetail> {
    const response = await apiClient.post<ITeamDetail>('/teams', payload);
    return response.data;
  },

  async updateTeam(id: string, payload: IUpdateTeamPayload): Promise<ITeamDetail> {
    const response = await apiClient.patch<ITeamDetail>(`/teams/${id}`, payload);
    return response.data;
  },

  async deleteTeam(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  },

  async getMemberOptions(params: IMemberOptionsQueryParams): Promise<IMemberOption[]> {
    const response = await apiClient.get<IMemberOption[]>('/teams/member-options', {
      params,
    });
    return response.data;
  },
};

