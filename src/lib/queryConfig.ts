import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized QueryClient configuration
 * For Android, iOS, and Web
 */
export const createOptimizedQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        
        // Retry failed requests up to 3 times
        retry: 3,
        
        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus (web only, safe for mobile)
        refetchOnWindowFocus: true,
        
        // Don't refetch on mount if data is fresh
        refetchOnMount: true,
        
        // Refetch when reconnecting
        refetchOnReconnect: true,
        
        // Network mode - always try to fetch
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        
        // Network mode for mutations
        networkMode: 'offlineFirst',
      },
    },
  });
};

/**
 * Query key factory for consistent caching
 */
export const queryKeys = {
  // User related
  profile: (userId?: string) => ['profile', userId] as const,
  profiles: (filters?: Record<string, unknown>) => ['profiles', filters] as const,
  
  // Messages
  conversations: () => ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  
  // Connections
  connections: () => ['connections'] as const,
  connectionRequests: () => ['connection-requests'] as const,
  
  // Content modules
  businessContent: (userId?: string) => ['business-content', userId] as const,
  familyContent: (userId?: string) => ['family-content', userId] as const,
  personalContent: (userId?: string) => ['personal-content', userId] as const,
  networkContent: (userId?: string) => ['network-content', userId] as const,
  
  // Verifications
  identityVerification: (userId?: string) => ['identity-verification', userId] as const,
  documentVerifications: (userId?: string) => ['document-verifications', userId] as const,
  
  // Admin
  adminMembers: (filters?: Record<string, unknown>) => ['admin', 'members', filters] as const,
  adminLogs: (filters?: Record<string, unknown>) => ['admin', 'logs', filters] as const,
  
  // Generic
  table: (tableName: string, filters?: Record<string, unknown>) => ['table', tableName, filters] as const,
} as const;

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  profile: (queryClient: QueryClient, userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  },
  
  conversations: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
  },
  
  messages: (queryClient: QueryClient, conversationId?: string) => {
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  },
  
  connections: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.connections() });
    queryClient.invalidateQueries({ queryKey: queryKeys.connectionRequests() });
  },
  
  content: (queryClient: QueryClient, type: 'business' | 'family' | 'personal' | 'network', userId?: string) => {
    const keyMap = {
      business: queryKeys.businessContent,
      family: queryKeys.familyContent,
      personal: queryKeys.personalContent,
      network: queryKeys.networkContent,
    };
    queryClient.invalidateQueries({ queryKey: keyMap[type](userId) });
  },
  
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries();
  },
};

/**
 * Prefetch helpers for navigation optimization
 */
export const prefetchQueries = {
  profile: async (queryClient: QueryClient, userId: string, fetchFn: () => Promise<unknown>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.profile(userId),
      queryFn: fetchFn,
      staleTime: 5 * 60 * 1000,
    });
  },
  
  conversations: async (queryClient: QueryClient, fetchFn: () => Promise<unknown>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.conversations(),
      queryFn: fetchFn,
      staleTime: 2 * 60 * 1000,
    });
  },
};

/**
 * Optimistic update helpers
 */
export const optimisticUpdates = {
  updateItem: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    itemId: string,
    updates: Partial<T>
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return old;
      return old.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
    });
  },
  
  addItem: <T>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    newItem: T
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return [newItem];
      return [newItem, ...old];
    });
  },
  
  removeItem: <T extends { id: string }>(
    queryClient: QueryClient,
    queryKey: readonly unknown[],
    itemId: string
  ) => {
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return old;
      return old.filter((item) => item.id !== itemId);
    });
  },
};

export default createOptimizedQueryClient;
