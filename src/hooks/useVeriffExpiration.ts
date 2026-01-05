/**
 * Hook pour gérer l'expiration des sessions Veriff
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getVerificationWithExpiration,
  retryExpiredVerification,
  startExpirationMonitor,
  formatExpirationTime,
  VerificationSession
} from '@/services/veriffExpirationService';
import { toast } from 'sonner';

interface UseVeriffExpirationOptions {
  autoCheck?: boolean;
  checkIntervalMs?: number;
  onExpired?: (session: VerificationSession) => void;
}

export function useVeriffExpiration(options: UseVeriffExpirationOptions = {}) {
  const { 
    autoCheck = true, 
    checkIntervalMs = 5 * 60 * 1000,
    onExpired 
  } = options;

  const [session, setSession] = useState<VerificationSession | null>(null);
  const [expirationStatus, setExpirationStatus] = useState<'valid' | 'expired' | 'expiring_soon' | 'unknown'>('unknown');
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getVerificationWithExpiration();
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setSession(result.session);
      
      if (result.expiration) {
        setExpirationStatus(result.expiration.status);
        if (result.expiration.expiresAt) {
          setTimeRemaining(formatExpirationTime(result.expiration.expiresAt));
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    setError(null);

    try {
      const result = await retryExpiredVerification();
      
      if (!result.success) {
        setError(result.error || 'Erreur lors du réessai');
        toast.error(result.error || 'Erreur lors du réessai');
        return { success: false };
      }

      if (result.redirectUrl) {
        toast.success('Nouvelle session créée, redirection...');
        window.location.href = result.redirectUrl;
        return { success: true, redirectUrl: result.redirectUrl };
      }

      return { success: true };
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors du réessai');
      return { success: false, error: err.message };
    } finally {
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();

    if (!autoCheck) return;

    const cleanup = startExpirationMonitor((expiredSession) => {
      setSession(expiredSession);
      setExpirationStatus('expired');
      setTimeRemaining('Expiré');
      
      toast.warning('Votre session de vérification a expiré', {
        action: {
          label: 'Réessayer',
          onClick: retry
        }
      });

      onExpired?.(expiredSession);
    }, checkIntervalMs);

    return cleanup;
  }, [autoCheck, checkIntervalMs, onExpired, loadStatus, retry]);

  useEffect(() => {
    if (!session?.expiresAt || expirationStatus === 'expired') return;

    const interval = setInterval(() => {
      if (session.expiresAt) {
        const remaining = formatExpirationTime(session.expiresAt);
        setTimeRemaining(remaining);
        
        if (remaining === 'Expiré') {
          setExpirationStatus('expired');
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [session?.expiresAt, expirationStatus]);

  return {
    session,
    expirationStatus,
    timeRemaining,
    isLoading,
    isRetrying,
    error,
    isExpired: expirationStatus === 'expired',
    isExpiringSoon: expirationStatus === 'expiring_soon',
    canRetry: session?.canRetry ?? false,
    retry,
    refresh: loadStatus
  };
}
