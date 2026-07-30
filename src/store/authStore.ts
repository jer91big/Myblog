import { create } from 'zustand';
import { User } from '../types';
import { authApi, setTokens, clearToken } from '../api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        setTokens(response.data.accessToken, response.data.refreshToken);
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          error: response.message || 'Login failed',
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: 'An error occurred during login',
        isLoading: false,
      });
    }
  },

  register: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(email, password, username);
      if (response.success && response.data) {
        setTokens(response.data.accessToken, response.data.refreshToken);
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          error: response.message || 'Registration failed',
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: 'An error occurred during registration',
        isLoading: false,
      });
    }
  },

  logout: () => {
    clearToken();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
