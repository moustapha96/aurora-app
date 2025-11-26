/**
 * Rate Limiting Helper
 * Protects against brute force attacks by limiting authentication attempts
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  blockedUntil?: string;
  retryAfter?: number; // seconds
  message?: string;
}

/**
 * Check if an action is allowed based on rate limiting
 * @param identifier - Email, IP address, or user identifier
 * @param endpoint - The endpoint being accessed ('login', 'register', 'reset-password', etc.)
 * @returns RateLimitResult indicating if the action is allowed
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string
): Promise<RateLimitResult> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        endpoint,
      }),
    });

    if (!response.ok) {
      // If the service is unavailable, fail open (allow the request)
      console.warn('Rate limit service unavailable, allowing request');
      return { allowed: true };
    }

    const result: RateLimitResult = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Fail open for availability - if rate limiting service is down, allow requests
    return { allowed: true };
  }
}

/**
 * Get client IP address (for IP-based rate limiting)
 * Note: This is a fallback. In production, IP should come from the server.
 */
export function getClientIdentifier(): string {
  // For now, we'll use a combination of user agent and a stored identifier
  // In production, the IP should be determined server-side
  const storedId = localStorage.getItem('client-identifier');
  if (storedId) {
    return storedId;
  }
  
  // Generate a unique identifier for this client
  const newId = `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  localStorage.setItem('client-identifier', newId);
  return newId;
}

/**
 * Format retry after message
 */
export function formatRetryMessage(retryAfter?: number): string {
  if (!retryAfter) return '';
  
  const minutes = Math.ceil(retryAfter / 60);
  if (minutes === 1) {
    return 'Please try again in 1 minute.';
  }
  return `Please try again in ${minutes} minutes.`;
}

/**
 * Reset rate limit after successful authentication
 * @param identifier - Email, IP address, or user identifier
 * @param endpoint - The endpoint that succeeded
 */
export async function resetRateLimit(
  identifier: string,
  endpoint: string
): Promise<void> {
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    await fetch(`${SUPABASE_URL}/functions/v1/reset-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        endpoint,
      }),
    });
    // Silently fail - if reset fails, rate limit will expire naturally
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    // Silently fail - not critical
  }
}

