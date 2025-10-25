import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

// Auth Types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Auth Hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      console.log("Auth success, storing token:", data.accessToken);
      // Store token in localStorage (client-side only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.accessToken);
        console.log("Token stored, checking:", localStorage.getItem('auth_token'));
      }
      // Cache user data
      queryClient.setQueryData(['auth', 'profile'], data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      const response = await api.post("/auth/register", data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log("Auth success, storing token:", data.accessToken);
      // Store token in localStorage (client-side only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.accessToken);
        console.log("Token stored, checking:", localStorage.getItem('auth_token'));
      }
      // Cache user data
      queryClient.setQueryData(['auth', 'profile'], data.user);
    },
  });
};

export const useProfile = () =>
  useQuery({
    queryKey: ["auth", "profile"],
    queryFn: async (): Promise<User> => {
      const response = await api.get("/auth/profile");
      return response.data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
    retry: false,
  });

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Clear token from localStorage (client-side only)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      // Clear all cached data
      queryClient.clear();
    },
    onSuccess: () => {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    },
  });
};

// Utility functions
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};
