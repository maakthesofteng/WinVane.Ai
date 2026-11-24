import { apiClient } from '@/lib/api/apiClient';
import type {
  ICreateRolePayload,
  ICreateRoleResult,
  IPermissionCatalogResponse,
  IRoleSummary,
  IUpdateRolePayload,
  IUpdateRolePermissionsPayload,
} from '../types/roles.types';

export const rolesApi = {
  async getRoles(): Promise<IRoleSummary[]> {
    const response = await apiClient.get<IRoleSummary[]>('/roles');
    return response.data;
  },

  async getRoleById(id: string): Promise<IRoleSummary> {
    const response = await apiClient.get<IRoleSummary>(`/roles/${id}`);
    return response.data;
  },

  async getPermissionsCatalog(): Promise<IPermissionCatalogResponse> {
    const response = await apiClient.get<IPermissionCatalogResponse>('/permissions');
    return response.data;
  },

  async createRole(payload: ICreateRolePayload): Promise<ICreateRoleResult> {
    const response = await apiClient.post<ICreateRoleResult>('/roles', payload);
    return response.data;
  },

  async updateRole(id: string, payload: IUpdateRolePayload): Promise<IRoleSummary> {
    const response = await apiClient.patch<IRoleSummary>(`/roles/${id}`, payload);
    return response.data;
  },

  async updateRolePermissions(
    id: string,
    payload: IUpdateRolePermissionsPayload
  ): Promise<IRoleSummary> {
    const response = await apiClient.put<IRoleSummary>(`/roles/${id}/permissions`, payload);
    return response.data;
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },
};

