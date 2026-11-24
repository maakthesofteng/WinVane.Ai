import { apiClient } from '@/lib/api/apiClient';
import type { IDepartment } from '../types/teams.types';

export const departmentsApi = {
  async getDepartments(search?: string): Promise<IDepartment[]> {
    const response = await apiClient.get<IDepartment[]>('/departments', {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  async createDepartment(payload: { name: string }): Promise<IDepartment> {
    const response = await apiClient.post<IDepartment>('/departments', payload);
    return response.data;
  },
};

