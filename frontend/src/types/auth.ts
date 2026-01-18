export interface User {
  id: string;
  username: string;
  fullName: string;
  roleId: string;
  roleName?: string;
  email: string;
  phone?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken?: string;
  };
  message?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
