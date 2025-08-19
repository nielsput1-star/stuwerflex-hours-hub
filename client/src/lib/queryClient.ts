import { QueryClient } from '@tanstack/react-query';

const API_BASE_URL = '';  // Backend and frontend run on the same port

// Create query client with default config
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Authenticated API request helper
export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  
  if (!response.ok) {
    // Handle auth errors
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
      throw new Error('Authentication failed');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
};

// Default fetcher for queries
export const defaultFetcher = async (url: string) => {
  return apiRequest(url);
};

// Configure the default query function
queryClient.setDefaultOptions({
  queries: {
    queryFn: ({ queryKey }) => defaultFetcher(queryKey[0] as string),
  },
});