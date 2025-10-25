import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time: 10 minutes  
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
    },
  },
});
