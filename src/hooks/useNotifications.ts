/**
 * Hook for managing mobile notifications
 * Provides easy access to push and local notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  initPushNotifications,
  initLocalNotifications,
  setupPushNotificationListeners,
  setupLocalNotificationListeners,
  showLocalNotification,
  scheduleLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  checkNotificationPermissions,
  requestAllNotificationPermissions,
  NotificationData,
} from '@/services/notificationService';

interface UseNotificationsReturn {
  // State
  isSupported: boolean;
  isInitialized: boolean;
  pushToken: string | null;
  permissions: {
    push: boolean;
    local: boolean;
  };
  
  // Actions
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<{ push: boolean; local: boolean }>;
  showNotification: (notification: NotificationData) => Promise<void>;
  scheduleNotification: (notification: NotificationData, triggerAt: Date) => Promise<number | null>;
  cancelScheduledNotification: (id: number) => Promise<void>;
  cancelAllScheduledNotifications: () => Promise<void>;
  
  // Convenience methods
  notifySuccess: (title: string, body: string) => Promise<void>;
  notifyError: (title: string, body: string) => Promise<void>;
  notifyMessage: (senderName: string, message: string) => Promise<void>;
  notifyConnectionRequest: (fromName: string) => Promise<void>;
  notifyConnectionAccepted: (byName: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const isSupported = Capacitor.isNativePlatform();
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({ push: false, local: false });

  // Initialize notifications on mount
  const initialize = useCallback(async () => {
    if (!isSupported || isInitialized) return;

    try {
      // Check current permissions
      const currentPerms = await checkNotificationPermissions();
      setPermissions(currentPerms);

      // Initialize push notifications
      const token = await initPushNotifications();
      setPushToken(token);

      // Initialize local notifications
      await initLocalNotifications();

      // Setup listeners
      setupPushNotificationListeners(
        (notification) => {
          console.log('Push notification received in hook:', notification);
        },
        (action) => {
          console.log('Push notification action in hook:', action);
          // Handle navigation based on notification data
          const data = action.notification.data;
          if (data?.route) {
            window.location.href = data.route as string;
          }
        }
      );

      setupLocalNotificationListeners(
        (notification) => {
          console.log('Local notification received in hook:', notification);
        },
        (action) => {
          console.log('Local notification action in hook:', action);
          // Handle navigation based on notification data
          const extra = action.notification.extra;
          if (extra?.route) {
            window.location.href = extra.route as string;
          }
        }
      );

      setIsInitialized(true);
      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [isSupported, isInitialized]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    const perms = await requestAllNotificationPermissions();
    setPermissions(perms);
    return perms;
  }, []);

  // Show notification
  const showNotification = useCallback(async (notification: NotificationData) => {
    await showLocalNotification(notification);
  }, []);

  // Schedule notification
  const scheduleNotification = useCallback(async (notification: NotificationData, triggerAt: Date) => {
    return await scheduleLocalNotification(notification, triggerAt);
  }, []);

  // Cancel scheduled notification
  const cancelScheduledNotification = useCallback(async (id: number) => {
    await cancelNotification(id);
  }, []);

  // Cancel all scheduled notifications
  const cancelAllScheduledNotifications = useCallback(async () => {
    await cancelAllNotifications();
  }, []);

  // Convenience: Success notification
  const notifySuccess = useCallback(async (title: string, body: string) => {
    await showLocalNotification({
      title: `✓ ${title}`,
      body,
      data: { type: 'success' },
    });
  }, []);

  // Convenience: Error notification
  const notifyError = useCallback(async (title: string, body: string) => {
    await showLocalNotification({
      title: `⚠ ${title}`,
      body,
      data: { type: 'error' },
    });
  }, []);

  // Convenience: New message notification
  const notifyMessage = useCallback(async (senderName: string, message: string) => {
    await showLocalNotification({
      title: 'Nouveau message',
      body: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      data: { type: 'message', route: '/messages' },
    });
  }, []);

  // Convenience: Connection request notification
  const notifyConnectionRequest = useCallback(async (fromName: string) => {
    await showLocalNotification({
      title: 'Demande de connexion',
      body: `${fromName} souhaite se connecter avec vous`,
      data: { type: 'connection_request', route: '/connections' },
    });
  }, []);

  // Convenience: Connection accepted notification
  const notifyConnectionAccepted = useCallback(async (byName: string) => {
    await showLocalNotification({
      title: 'Connexion acceptée',
      body: `${byName} a accepté votre demande de connexion`,
      data: { type: 'connection_accepted', route: '/connections' },
    });
  }, []);

  // Auto-initialize on mount if on native platform
  useEffect(() => {
    if (isSupported && !isInitialized) {
      initialize();
    }
  }, [isSupported, isInitialized, initialize]);

  return {
    isSupported,
    isInitialized,
    pushToken,
    permissions,
    initialize,
    requestPermissions,
    showNotification,
    scheduleNotification,
    cancelScheduledNotification,
    cancelAllScheduledNotifications,
    notifySuccess,
    notifyError,
    notifyMessage,
    notifyConnectionRequest,
    notifyConnectionAccepted,
  };
}
