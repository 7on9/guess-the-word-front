import axios from "axios";

export const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000") + "/api/v1",
});

// Add request interceptor for debugging and authentication
api.interceptors.request.use(
  (config) => {
    // Add JWT token if available (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      console.log("Retrieved token from localStorage:", token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`[API Headers]`, config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("[API Error]", error.response?.data || error.message);
    
    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);
