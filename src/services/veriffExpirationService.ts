/**
 * Veriff Expiration Service
 * Gère les sessions Veriff expirées avec retry automatique
 */

import { supabase } from '@/integrations/supabase/client';

// Durée de validité d'une session Veriff (7 jours en ms)
const SESSION_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

// Délai minimum entre les vérifications (10 minutes)
const MIN_CHECK_INTERVAL_MS = 10 * 60 * 1000;

export interface VerificationSession {
  id: string;
  status: string;
  createdAt: string;
  sessionId?: string;
  isExpired: boolean;
  canRetry: boolean;
  expiresAt?: Date;
}

interface ExpirationCheckResult {
  isExpired: boolean;
  status: 'valid' | 'expired' | 'expiring_soon' | 'unknown';
  expiresAt?: Date;
  hoursRemaining?: number;
}

let lastCheckTime = 0;

/**
 * Vérifie si une session Veriff est expirée
 */
export function checkSessionExpiration(createdAt: string): ExpirationCheckResult {
  const createdDate = new Date(createdAt);
  const expiresAt = new Date(createdDate.getTime() + SESSION_VALIDITY_MS);
  const now = new Date();
  const hoursRemaining = Math.max(0, (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000));

  if (now > expiresAt) {
    return {
      isExpired: true,
      status: 'expired',
      expiresAt,
      hoursRemaining: 0
    };
  }

  // Avertir si expire dans moins de 24h
  if (hoursRemaining < 24) {
    return {
      isExpired: false,
      status: 'expiring_soon',
      expiresAt,
      hoursRemaining
    };
  }

  return {
    isExpired: false,
    status: 'valid',
    expiresAt,
    hoursRemaining
  };
}

/**
 * Récupère le statut de vérification avec gestion d'expiration
 */
export async function getVerificationWithExpiration(): Promise<{
  session: VerificationSession | null;
  expiration: ExpirationCheckResult | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('veriff-verification', {
      body: { action: 'status' }
    });

    if (error) {
      console.error('Error fetching verification status:', error);
      return { session: null, expiration: null, error: error.message };
    }

    if (!data?.verification) {
      return { 
        session: null, 
        expiration: null, 
        error: null 
      };
    }

    const verification = data.verification;
    const expiration = checkSessionExpiration(verification.created_at);

    // Déterminer si on peut réessayer
    const canRetry = 
      expiration.isExpired || 
      verification.status === 'rejected' ||
      verification.status === 'review_needed';

    const session: VerificationSession = {
      id: verification.id,
      status: verification.status,
      createdAt: verification.created_at,
      sessionId: verification.verification_result?.veriff_session_id,
      isExpired: expiration.isExpired,
      canRetry,
      expiresAt: expiration.expiresAt
    };

    return { session, expiration, error: null };
  } catch (error: any) {
    console.error('Error in getVerificationWithExpiration:', error);
    return { session: null, expiration: null, error: error.message };
  }
}

/**
 * Vérifie et met à jour le statut si la session est expirée
 */
export async function checkAndUpdateExpiredSession(): Promise<{
  wasExpired: boolean;
  newSession?: VerificationSession;
  error?: string;
}> {
  // Éviter les appels trop fréquents
  const now = Date.now();
  if (now - lastCheckTime < MIN_CHECK_INTERVAL_MS) {
    console.log('Skipping expiration check, too soon since last check');
    return { wasExpired: false };
  }
  lastCheckTime = now;

  try {
    const { session, expiration, error } = await getVerificationWithExpiration();

    if (error || !session) {
      return { wasExpired: false, error };
    }

    // Si la session est expirée et en attente, la marquer comme expirée
    if (expiration?.isExpired && 
        (session.status === 'initiated' || session.status === 'pending')) {
      
      console.log('Marking expired verification session:', session.id);
      
      // Appeler le backend pour vérifier le statut final
      const { data: refreshData, error: refreshError } = await supabase.functions.invoke('veriff-verification', {
        body: { action: 'status' }
      });

      if (refreshError) {
        return { wasExpired: true, error: refreshError.message };
      }

      // Si toujours en attente après refresh, c'est vraiment expiré
      if (refreshData?.verification?.status === 'initiated' || 
          refreshData?.verification?.status === 'pending') {
        return { 
          wasExpired: true, 
          newSession: {
            ...session,
            status: 'expired',
            isExpired: true,
            canRetry: true
          }
        };
      }

      // Sinon retourner le nouveau statut
      return {
        wasExpired: false,
        newSession: {
          id: refreshData.verification.id,
          status: refreshData.verification.status,
          createdAt: refreshData.verification.created_at,
          sessionId: refreshData.verification.verification_result?.veriff_session_id,
          isExpired: false,
          canRetry: refreshData.verification.status === 'rejected'
        }
      };
    }

    return { wasExpired: false, newSession: session };
  } catch (error: any) {
    console.error('Error checking expired session:', error);
    return { wasExpired: false, error: error.message };
  }
}

/**
 * Initie une nouvelle session de vérification (retry après expiration)
 */
export async function retryExpiredVerification(): Promise<{
  success: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('veriff-verification', {
      body: { action: 'create-session' }
    });

    if (error) {
      console.error('Error creating new session:', error);
      return { success: false, error: error.message };
    }

    if (data?.success && data?.redirectUrl) {
      return { 
        success: true, 
        redirectUrl: data.redirectUrl 
      };
    }

    return { 
      success: false, 
      error: data?.error || 'Erreur lors de la création de la session' 
    };
  } catch (error: any) {
    console.error('Error in retryExpiredVerification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Hook utilitaire pour vérifier périodiquement l'expiration
 */
export function startExpirationMonitor(
  onExpired: (session: VerificationSession) => void,
  intervalMs: number = 5 * 60 * 1000 // 5 minutes par défaut
): () => void {
  const check = async () => {
    const { wasExpired, newSession, error } = await checkAndUpdateExpiredSession();
    
    if (wasExpired && newSession) {
      onExpired(newSession);
    }
  };

  // Check initial
  check();

  // Periodic check
  const intervalId = setInterval(check, intervalMs);

  // Cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Formatte le temps restant avant expiration
 */
export function formatExpirationTime(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) return 'Expiré';

  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `${hours} heure${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(diff / (60 * 1000));
  return `${minutes} minute${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}`;
}
