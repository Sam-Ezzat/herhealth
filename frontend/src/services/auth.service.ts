import api from './api';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

class AuthService {
  async login(username: string, password: string) {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    // The API returns { success: true, data: { user, token } }
    return response.data;
  }

  async getCurrentUser() {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data;
  }

  async logout() {
    // Clear token from axios headers
    delete api.defaults.headers.common['Authorization'];
  }
}

export default new AuthService();
