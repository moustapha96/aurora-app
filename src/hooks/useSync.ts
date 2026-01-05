/**
 * Hook pour la synchronisation avec gestion offline, retry, etc.
 * Compatible Android, iOS, Web
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getConnectionState, 
  subscribeToConnection,
  smartSync,
  getQueueLength,
  getRateLimitInfo,
  createOptimisticUpdate,
  confirmOptimisticUpdate,
  rollbackOptimisticUpdate,
  withRetry
} from '@/services/syncService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================
// CONNECTION STATUS HOOK
// ============================================================

export function useConnectionStatus() {
  const [state, setState] = useState(getConnectionState());

  useEffect(() => {
    const unsubscribe = subscribeToConnection(setState);
    return unsubscribe;
  }, []);

  return {
    isOnline: state.isOnline,
    connectionQuality: state.connectionQuality,
    lastOnline: state.lastOnline,
    isSlowConnection: state.connectionQuality === 'slow'
  };
}

// ============================================================
// OFFLINE QUEUE HOOK
// ============================================================

export function useOfflineQueue() {
  const [queueLength, setQueueLength] = useState(getQueueLength());

  useEffect(() => {
    // Check queue periodically
    const interval = setInterval(() => {
      setQueueLength(getQueueLength());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    queueLength,
    hasPendingActions: queueLength > 0
  };
}

// ============================================================
// RATE LIMIT HOOK
// ============================================================

export function useRateLimit() {
  const [info, setInfo] = useState(getRateLimitInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setInfo(getRateLimitInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return info;
}

// ============================================================
// OPTIMISTIC UPDATE HOOK
// ============================================================

interface UseOptimisticMutationOptions<T> {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  onSuccess?: (data: T) => void;
  onError?: (error: Error, originalData?: T) => void;
  onOptimistic?: (data: T) => void;
  showToast?: boolean;
}

export function useOptimisticMutation<T extends { id?: string }>(
  options: UseOptimisticMutationOptions<T>
) {
  const { table, operation, onSuccess, onError, onOptimistic, showToast = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: T, originalData?: T) => {
    setIsLoading(true);
    setError(null);

    // Create optimistic update
    const optimisticId = createOptimisticUpdate(table, operation, data, originalData);
    
    // Notify about optimistic update
    onOptimistic?.(data);

    try {
      const result = await smartSync(table, operation, data, {
        enableRetry: true,
        enableOfflineQueue: true,
        enableRateLimit: true
      });

      if (result.error) {
        throw result.error;
      }

      if (result.queued) {
        if (showToast) {
          toast.info('Action en attente de connexion');
        }
      } else {
        confirmOptimisticUpdate(optimisticId);
        onSuccess?.(result.data as T);
        if (showToast) {
          toast.success('Sauvegardé');
        }
      }

      setIsLoading(false);
      return { success: true, data: result.data, queued: result.queued };
    } catch (err: any) {
      const rollbackData = rollbackOptimisticUpdate(optimisticId);
      setError(err);
      onError?.(err, rollbackData);
      
      if (showToast) {
        toast.error('Erreur lors de la sauvegarde');
      }

      setIsLoading(false);
      return { success: false, error: err };
    }
  }, [table, operation, onSuccess, onError, onOptimistic, showToast]);

  return {
    mutate,
    isLoading,
    error
  };
}

// ============================================================
// SYNCED QUERY HOOK
// ============================================================

interface UseSyncedQueryOptions<T> {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  enabled?: boolean;
  refetchOnReconnect?: boolean;
  staleTime?: number;
}

export function useSyncedQuery<T>(options: UseSyncedQueryOptions<T>) {
  const { 
    table, 
    select = '*', 
    filter, 
    orderBy,
    enabled = true,
    refetchOnReconnect = true,
    staleTime = 30000
  } = options;

  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchRef = useRef<number>(0);
  const { isOnline } = useConnectionStatus();

  const fetch = useCallback(async () => {
    if (!enabled) return;

    // Check if data is still fresh
    const now = Date.now();
    if (data && now - lastFetchRef.current < staleTime) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await withRetry(async () => {
        // Build query with type assertions to avoid deep instantiation
        const baseQuery = supabase.from(table as any).select(select);
        let finalQuery: any = baseQuery;

        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            finalQuery = finalQuery.eq(key, value);
          });
        }

        if (orderBy) {
          finalQuery = finalQuery.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        const { data: queryData, error: queryError } = await finalQuery;
        if (queryError) throw queryError;
        return queryData;
      });

      setData(result as T[]);
      lastFetchRef.current = Date.now();
    } catch (err: any) {
      console.error(`Error fetching ${table}:`, err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [table, select, filter, orderBy, enabled, staleTime, data]);

  // Initial fetch
  useEffect(() => {
    fetch();
  }, [enabled]);

  // Refetch on reconnect
  useEffect(() => {
    if (refetchOnReconnect && isOnline) {
      fetch();
    }
  }, [isOnline, refetchOnReconnect, fetch]);

  const refetch = useCallback(() => {
    lastFetchRef.current = 0; // Force refetch
    return fetch();
  }, [fetch]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

// ============================================================
// CONFLICT DETECTION HOOK
// ============================================================

interface UseConflictDetectionOptions<T> {
  data: T | null;
  serverTimestamp?: string;
  onConflict?: (local: T, remote: T) => void;
}

export function useConflictDetection<T extends { updated_at?: string }>(
  options: UseConflictDetectionOptions<T>
) {
  const { data, serverTimestamp, onConflict } = options;
  const [hasConflict, setHasConflict] = useState(false);
  const [remoteData, setRemoteData] = useState<T | null>(null);
  const lastKnownTimestampRef = useRef<string | undefined>(serverTimestamp);

  useEffect(() => {
    if (data?.updated_at && lastKnownTimestampRef.current) {
      if (new Date(data.updated_at) > new Date(lastKnownTimestampRef.current)) {
        setHasConflict(true);
        setRemoteData(data);
        onConflict?.(data, data);
      }
    }
    lastKnownTimestampRef.current = data?.updated_at;
  }, [data?.updated_at]);

  const resolveConflict = useCallback((choice: 'local' | 'remote') => {
    setHasConflict(false);
    setRemoteData(null);
  }, []);

  return {
    hasConflict,
    remoteData,
    resolveConflict
  };
}
