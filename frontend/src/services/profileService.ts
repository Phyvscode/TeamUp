import { apiClient } from '@/lib/apiClient';
import type { Project } from '@/store/useAppStore';

interface ProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  resumeUrl?: string;
  projects?: Project[];
}

export const profileService = {
  async getProfile() {
    return apiClient.get<ProfileUpdate>('/profile');
  },

  async updateProfile(data: ProfileUpdate) {
    return apiClient.put<ProfileUpdate>('/profile', data);
  },

  async addProject(project: Omit<Project, 'id'>) {
    return apiClient.post<Project>('/profile/projects', project);
  },

  async deleteProject(projectId: string) {
    return apiClient.delete(`/profile/projects/${projectId}`);
  },
};
