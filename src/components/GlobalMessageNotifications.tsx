/**
 * Global component to handle message notifications across the app
 * This should be mounted in the app root
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { useNotifications } from '@/hooks/useNotifications';

export function GlobalMessageNotifications() {
  const location = useLocation();
  const { setCurrentConversation } = useMessageNotifications();
  const { initialize, isInitialized, isSupported } = useNotifications();

  // Initialize mobile notifications on mount
  useEffect(() => {
    if (isSupported && !isInitialized) {
      initialize();
    }
  }, [isSupported, isInitialized, initialize]);

  // Reset current conversation when not on messages page
  useEffect(() => {
    if (!location.pathname.startsWith('/messages')) {
      setCurrentConversation(null);
    }
  }, [location.pathname, setCurrentConversation]);

  return null;
}
