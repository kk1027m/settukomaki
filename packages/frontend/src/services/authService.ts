import { api } from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  full_name: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/password', { currentPassword, newPassword });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
