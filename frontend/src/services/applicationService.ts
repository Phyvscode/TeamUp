import { apiClient } from '@/lib/apiClient';
import type { JobApplication, Interview } from '@/store/useAppStore';

export const applicationService = {
  // Applications
  async getApplications() {
    return apiClient.get<JobApplication[]>('/applications');
  },

  async createApplication(data: Omit<JobApplication, 'id'>) {
    return apiClient.post<JobApplication>('/applications', data);
  },

  async updateApplicationStatus(id: string, status: JobApplication['status']) {
    return apiClient.patch<JobApplication>(`/applications/${id}`, { status });
  },

  // Interviews
  async getInterviews() {
    return apiClient.get<Interview[]>('/interviews');
  },

  async createInterview(data: Omit<Interview, 'id'>) {
    return apiClient.post<Interview>('/interviews', data);
  },

  async updateInterview(id: string, data: Partial<Interview>) {
    return apiClient.patch<Interview>(`/interviews/${id}`, data);
  },
};
