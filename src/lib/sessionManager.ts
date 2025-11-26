/**
 * Session Manager
 * Manages user sessions based on admin settings
 */

import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/contexts/SettingsContext';

let sessionCheckInterval: NodeJS.Timeout | null = null;
let lastActivityTime: number = Date.now();

/**
 * Initialize session management
 * Should be called when user logs in
 */
export const initializeSession = (settings: { sessionTimeout: number }) => {
  // Clear any existing interval
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }

  // Update last activity time
  lastActivityTime = Date.now();

  // Check session timeout every minute
  sessionCheckInterval = setInterval(() => {
    checkSessionTimeout(settings.sessionTimeout);
  }, 60000); // Check every minute

  // Track user activity
  document.addEventListener('mousedown', updateLastActivity);
  document.addEventListener('keydown', updateLastActivity);
  document.addEventListener('scroll', updateLastActivity);
  document.addEventListener('touchstart', updateLastActivity);
};

/**
 * Update last activity time
 */
const updateLastActivity = () => {
  lastActivityTime = Date.now();
};

/**
 * Check if session has timed out
 */
const checkSessionTimeout = async (sessionTimeoutMinutes: number) => {
  const now = Date.now();
  const inactiveTime = (now - lastActivityTime) / 1000 / 60; // Convert to minutes

  if (inactiveTime >= sessionTimeoutMinutes) {
    // Session has timed out
    await handleSessionTimeout();
  } else if (inactiveTime >= sessionTimeoutMinutes * 0.8) {
    // Warn user that session will expire soon (80% of timeout)
    const remainingMinutes = Math.ceil(sessionTimeoutMinutes - inactiveTime);
    showSessionWarning(remainingMinutes);
  }
};

/**
 * Show warning before session timeout
 */
const showSessionWarning = (remainingMinutes: number) => {
  // This could trigger a toast or modal warning
  // For now, we'll just log it
  console.log(`Session will expire in ${remainingMinutes} minutes`);
  
  // You can integrate with toast here:
  // import { toast } from 'sonner';
  // toast.warning(`Votre session expirera dans ${remainingMinutes} minute(s)`);
};

/**
 * Handle session timeout
 */
const handleSessionTimeout = async () => {
  // Clear interval
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }

  // Sign out user
  await supabase.auth.signOut();
  
  // Redirect to login
  window.location.href = '/login?session=expired';
};

/**
 * Clear session management
 * Should be called when user logs out
 */
export const clearSession = () => {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }

  // Remove event listeners
  document.removeEventListener('mousedown', updateLastActivity);
  document.removeEventListener('keydown', updateLastActivity);
  document.removeEventListener('scroll', updateLastActivity);
  document.removeEventListener('touchstart', updateLastActivity);
};

/**
 * Reset session timer
 * Can be called manually to extend session
 */
export const resetSessionTimer = () => {
  lastActivityTime = Date.now();
};

