/**
 * Sync Service - Gestion de la synchronisation, retry, offline queue
 * Compatible Android, iOS, Web
 */

import { supabase } from '@/integrations/supabase/client';

// Types
interface QueuedAction {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

interface ConnectionState {
  isOnline: boolean;
  lastOnline: number;
  connectionQuality: 'good' | 'slow' | 'offline';
}

interface RateLimitState {
  requests: number;
  windowStart: number;
  blocked: boolean;
}

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000]; // Exponential backoff
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const QUEUE_STORAGE_KEY = 'aurora_offline_queue';
const CONNECTION_CHECK_INTERVAL = 30000;

// State
let connectionState: ConnectionState = {
  isOnline: navigator.onLine,
  lastOnline: Date.now(),
  connectionQuality: navigator.onLine ? 'good' : 'offline'
};

let rateLimitState: RateLimitState = {
  requests: 0,
  windowStart: Date.now(),
  blocked: false
};

let connectionListeners: ((state: ConnectionState) => void)[] = [];
let processingQueue = false;

// ============================================================
// CONNECTION STATUS
// ============================================================

export function getConnectionState(): ConnectionState {
  return { ...connectionState };
}

export function subscribeToConnection(callback: (state: ConnectionState) => void): () => void {
  connectionListeners.push(callback);
  return () => {
    connectionListeners = connectionListeners.filter(cb => cb !== callback);
  };
}

function notifyConnectionChange() {
  connectionListeners.forEach(cb => cb(getConnectionState()));
}

async function checkConnectionQuality(): Promise<'good' | 'slow' | 'offline'> {
  if (!navigator.onLine) return 'offline';
  
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      }
    });
    
    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    
    return latency < 1000 ? 'good' : 'slow';
  } catch {
    return navigator.onLine ? 'slow' : 'offline';
  }
}

function initConnectionMonitoring() {
  // Browser events
  window.addEventListener('online', async () => {
    connectionState.isOnline = true;
    connectionState.lastOnline = Date.now();
    connectionState.connectionQuality = await checkConnectionQuality();
    notifyConnectionChange();
    processOfflineQueue();
  });

  window.addEventListener('offline', () => {
    connectionState.isOnline = false;
    connectionState.connectionQuality = 'offline';
    notifyConnectionChange();
  });

  // Periodic check
  setInterval(async () => {
    const quality = await checkConnectionQuality();
    if (quality !== connectionState.connectionQuality) {
      connectionState.connectionQuality = quality;
      connectionState.isOnline = quality !== 'offline';
      if (connectionState.isOnline) {
        connectionState.lastOnline = Date.now();
      }
      notifyConnectionChange();
    }
  }, CONNECTION_CHECK_INTERVAL);
}

// ============================================================
// RATE LIMITING
// ============================================================

function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Reset window if expired
  if (now - rateLimitState.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitState = {
      requests: 0,
      windowStart: now,
      blocked: false
    };
  }
  
  // Check if blocked
  if (rateLimitState.requests >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitState.blocked = true;
    console.warn('Rate limit reached, requests will be queued');
    return false;
  }
  
  rateLimitState.requests++;
  return true;
}

export function getRateLimitInfo(): { remaining: number; resetIn: number; blocked: boolean } {
  const now = Date.now();
  return {
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - rateLimitState.requests),
    resetIn: Math.max(0, RATE_LIMIT_WINDOW - (now - rateLimitState.windowStart)),
    blocked: rateLimitState.blocked
  };
}

// ============================================================
// OFFLINE QUEUE
// ============================================================

function getOfflineQueue(): QueuedAction[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: QueuedAction[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
}

export function addToOfflineQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) {
  const queue = getOfflineQueue();
  const newAction: QueuedAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retryCount: 0
  };
  queue.push(newAction);
  saveOfflineQueue(queue);
  console.log('Action queued for later:', newAction.table, newAction.operation);
}

export function getQueueLength(): number {
  return getOfflineQueue().length;
}

async function processOfflineQueue() {
  if (processingQueue || !connectionState.isOnline) return;
  
  processingQueue = true;
  const queue = getOfflineQueue();
  const remaining: QueuedAction[] = [];
  
  console.log(`Processing ${queue.length} queued actions...`);
  
  for (const action of queue) {
    try {
      await executeAction(action);
      console.log('Queued action executed:', action.table, action.operation);
    } catch (error: any) {
      action.retryCount++;
      action.lastError = error.message;
      
      if (action.retryCount < MAX_RETRIES) {
        remaining.push(action);
      } else {
        console.error('Action failed after max retries:', action);
      }
    }
  }
  
  saveOfflineQueue(remaining);
  processingQueue = false;
  
  if (remaining.length > 0) {
    console.log(`${remaining.length} actions still pending`);
  }
}

async function executeAction(action: QueuedAction): Promise<any> {
  const { table, operation, data } = action;
  
  // Use type assertion for dynamic table access
  const tableRef = supabase.from(table as any);
  
  switch (operation) {
    case 'insert':
      return tableRef.insert(data as any);
    case 'update':
      if (!data.id) throw new Error('Update requires id');
      return tableRef.update(data as any).eq('id', data.id);
    case 'delete':
      if (!data.id) throw new Error('Delete requires id');
      return tableRef.delete().eq('id', data.id);
    case 'upsert':
      return tableRef.upsert(data as any);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// ============================================================
// RETRY LOGIC
// ============================================================

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = MAX_RETRIES, onRetry } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      console.log(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
      
      onRetry?.(attempt + 1, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unreachable');
}

// ============================================================
// CONFLICT RESOLUTION
// ============================================================

interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  mergeFields?: string[];
}

export async function resolveConflict<T extends { updated_at?: string }>(
  localData: T,
  remoteData: T,
  resolution: ConflictResolution
): Promise<T> {
  switch (resolution.strategy) {
    case 'local':
      return localData;
    
    case 'remote':
      return remoteData;
    
    case 'merge':
      // Merge specific fields from local, rest from remote
      const merged = { ...remoteData };
      if (resolution.mergeFields) {
        for (const field of resolution.mergeFields) {
          if (field in localData) {
            (merged as any)[field] = (localData as any)[field];
          }
        }
      }
      return merged;
    
    case 'manual':
      // Return remote and let UI handle it
      return remoteData;
    
    default:
      // Default: last-write-wins based on updated_at
      if (localData.updated_at && remoteData.updated_at) {
        return new Date(localData.updated_at) > new Date(remoteData.updated_at)
          ? localData
          : remoteData;
      }
      return remoteData;
  }
}

export function detectConflict<T extends { updated_at?: string }>(
  localData: T,
  remoteData: T,
  lastKnownTimestamp?: string
): boolean {
  if (!lastKnownTimestamp || !remoteData.updated_at) return false;
  return new Date(remoteData.updated_at) > new Date(lastKnownTimestamp);
}

// ============================================================
// OPTIMISTIC UPDATES
// ============================================================

interface OptimisticUpdate<T> {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  optimisticData: T;
  originalData?: T;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

const optimisticUpdates = new Map<string, OptimisticUpdate<any>>();

export function createOptimisticUpdate<T>(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  optimisticData: T,
  originalData?: T
): string {
  const id = crypto.randomUUID();
  optimisticUpdates.set(id, {
    id,
    table,
    operation,
    optimisticData,
    originalData,
    timestamp: Date.now(),
    status: 'pending'
  });
  return id;
}

export function confirmOptimisticUpdate(id: string) {
  const update = optimisticUpdates.get(id);
  if (update) {
    update.status = 'confirmed';
    // Cleanup after 5s
    setTimeout(() => optimisticUpdates.delete(id), 5000);
  }
}

export function rollbackOptimisticUpdate(id: string): any | undefined {
  const update = optimisticUpdates.get(id);
  if (update) {
    update.status = 'failed';
    const originalData = update.originalData;
    // Cleanup after 5s
    setTimeout(() => optimisticUpdates.delete(id), 5000);
    return originalData;
  }
  return undefined;
}

export function getOptimisticUpdate(id: string): OptimisticUpdate<any> | undefined {
  return optimisticUpdates.get(id);
}

// ============================================================
// SMART SYNC
// ============================================================

interface SyncOptions {
  enableRetry?: boolean;
  enableOfflineQueue?: boolean;
  enableRateLimit?: boolean;
  conflictResolution?: ConflictResolution;
}

export async function smartSync<T>(
  table: string,
  operation: 'insert' | 'update' | 'delete' | 'upsert',
  data: T,
  options: SyncOptions = {}
): Promise<{ data: T | null; error: Error | null; queued: boolean }> {
  const {
    enableRetry = true,
    enableOfflineQueue = true,
    enableRateLimit = true,
  } = options;

  // Check rate limit
  if (enableRateLimit && !checkRateLimit()) {
    if (enableOfflineQueue) {
      addToOfflineQueue({ table, operation, data });
      return { data: data, error: null, queued: true };
    }
    return { data: null, error: new Error('Rate limit exceeded'), queued: false };
  }

  // Check connection
  if (!connectionState.isOnline) {
    if (enableOfflineQueue) {
      addToOfflineQueue({ table, operation, data });
      return { data: data, error: null, queued: true };
    }
    return { data: null, error: new Error('No connection'), queued: false };
  }

  // Execute with retry
  try {
    const executeSync = async () => {
      const action: QueuedAction = {
        id: '',
        table,
        operation,
        data,
        timestamp: Date.now(),
        retryCount: 0
      };
      const result = await executeAction(action);
      if (result.error) throw result.error;
      return result.data;
    };

    const result = enableRetry
      ? await withRetry(executeSync)
      : await executeSync();

    return { data: result, error: null, queued: false };
  } catch (error: any) {
    if (enableOfflineQueue) {
      addToOfflineQueue({ table, operation, data });
      return { data: data, error: null, queued: true };
    }
    return { data: null, error, queued: false };
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

export function initSyncService() {
  initConnectionMonitoring();
  
  // Process queue on startup if online
  if (connectionState.isOnline) {
    processOfflineQueue();
  }
  
  console.log('Sync service initialized');
}

// Auto-init
if (typeof window !== 'undefined') {
  initSyncService();
}
