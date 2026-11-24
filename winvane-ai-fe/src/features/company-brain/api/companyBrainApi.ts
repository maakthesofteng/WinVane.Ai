import { apiClient } from '@/lib/api/apiClient';
import type {
  ICompanyBrain,
  ICompanyBrainExtraction,
  IUpdateCompanyBrainPayload,
} from '../types/companyBrain.types';

export const companyBrainApi = {
  async getProfile(): Promise<ICompanyBrain> {
    const response = await apiClient.get<ICompanyBrain>('/company-brain');
    return response.data;
  },

  async saveProfile(payload: IUpdateCompanyBrainPayload): Promise<ICompanyBrain> {
    const response = await apiClient.put<ICompanyBrain>('/company-brain', payload);
    return response.data;
  },

  async extractFromPdf(file: File): Promise<ICompanyBrainExtraction> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ICompanyBrainExtraction>(
      '/company-brain/extract',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
};
