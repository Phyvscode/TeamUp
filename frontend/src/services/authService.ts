import { apiClient } from '@/lib/apiClient';
import type { UserRole } from '@/store/useAppStore';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    phone?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    projects?: {
      id: string;
      title: string;
      description: string;
      techStack: string[];
      link?: string;
    }[];
    resumeUrl?: string;
  };
}

export const authService = {

  async signup(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AuthResponse> {

    const response = await apiClient.post<AuthResponse>(
      '/auth/signup',
      data
    );

    localStorage.setItem('auth_token', response.token);

    return response;
  },


  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {

    const response = await apiClient.post<AuthResponse>(
      '/auth/login',
      data
    );

    localStorage.setItem('auth_token', response.token);

    return response;
  },


  async getMe(): Promise<AuthResponse['user']> {
    return apiClient.get<AuthResponse['user']>('/auth/me');
  },


  logout() {
    localStorage.removeItem('auth_token');
  },


  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

};