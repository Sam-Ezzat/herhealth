import { create } from 'zustand';
import { User } from '../types/auth';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  fetchUserPermissions: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    // Token will be automatically added by the request interceptor
    set({ user, token, isAuthenticated: true });
    
    // Fetch user permissions after login
    get().fetchUserPermissions();
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Token removal is handled by the request interceptor
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        // Token will be automatically added by the request interceptor
        set({ user, token, isAuthenticated: true });
        
        // Fetch user permissions
        get().fetchUserPermissions();
      } catch (error) {
        console.error('Failed to load auth from storage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  },

  fetchUserPermissions: async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data?.data || response.data;
      
      if (userData) {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            ...userData,
            permissions: userData.permissions || [],
          };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
    }
  },
}));
