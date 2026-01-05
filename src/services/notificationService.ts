/**
 * Notification Service for Mobile Push and Local Notifications
 * Handles both push notifications (FCM/APNS) and local popup notifications
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications, LocalNotificationSchema, ScheduleOptions } from '@capacitor/local-notifications';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Check if we're on a native platform
const isNative = Capacitor.isNativePlatform();

/**
 * Initialize push notifications
 * Must be called early in the app lifecycle
 */
export const initPushNotifications = async (): Promise<string | null> => {
  if (!isNative) {
    console.log('Push notifications not available on web');
    return null;
  }

  try {
    // Vérifier si le plugin est disponible (vérification basique)
    if (!PushNotifications) {
      console.log('Push notifications plugin not available');
      return null;
    }

    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    
    if (permResult.receive === 'granted') {
      try {
        // Register with Apple / Google to receive push
        await PushNotifications.register();
        
        // Get the token avec timeout pour éviter de bloquer indéfiniment
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('Push registration timeout');
            resolve(null);
          }, 10000); // 10 secondes timeout
          
          PushNotifications.addListener('registration', (token: Token) => {
            clearTimeout(timeout);
            console.log('Push registration success, token:', token.value);
            resolve(token.value);
          });
          
          PushNotifications.addListener('registrationError', (error: any) => {
            clearTimeout(timeout);
            console.error('Push registration error:', error);
            // Ne pas faire planter l'app si Firebase n'est pas configuré
            const errorMessage = error?.message || String(error);
            if (errorMessage.includes('Firebase') || errorMessage.includes('firebase')) {
              console.warn('Firebase not configured, push notifications disabled');
            }
            resolve(null);
          });
        });
      } catch (registerError: any) {
        // Gérer spécifiquement les erreurs Firebase
        if (registerError?.message?.includes('Firebase') || registerError?.message?.includes('firebase') || 
            registerError?.message?.includes('FirebaseApp')) {
          console.warn('Firebase not configured, push notifications disabled:', registerError.message);
          return null;
        }
        throw registerError; // Relancer les autres erreurs
      }
    } else {
      console.log('Push notification permission denied');
      return null;
    }
  } catch (error: any) {
    // Gérer les erreurs Firebase de manière plus robuste
    if (error?.message?.includes('Firebase') || error?.message?.includes('firebase') || 
        error?.message?.includes('FirebaseApp')) {
      console.warn('Firebase not configured, push notifications disabled:', error.message);
      return null;
    }
    console.error('Error initializing push notifications:', error);
    return null;
  }
};

/**
 * Setup push notification listeners
 */
export const setupPushNotificationListeners = (
  onNotificationReceived?: (notification: PushNotificationSchema) => void,
  onNotificationAction?: (notification: ActionPerformed) => void
) => {
  if (!isNative) return;

  // Notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
    onNotificationReceived?.(notification);
    
    // Show as local notification when app is in foreground
    showLocalNotification({
      title: notification.title || 'Aurora Society',
      body: notification.body || '',
      data: notification.data,
    });
  });

  // User tapped on notification
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed:', notification);
    onNotificationAction?.(notification);
  });
};

/**
 * Initialize local notifications
 */
export const initLocalNotifications = async (): Promise<boolean> => {
  if (!isNative) {
    console.log('Local notifications not available on web');
    return false;
  }

  try {
    const permResult = await LocalNotifications.requestPermissions();
    return permResult.display === 'granted';
  } catch (error) {
    console.error('Error initializing local notifications:', error);
    return false;
  }
};

/**
 * Show a local notification immediately (popup notification)
 */
export const showLocalNotification = async (notification: NotificationData): Promise<void> => {
  if (!isNative) {
    // Fallback for web: use browser notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192.png',
      });
    }
    return;
  }

  try {
    const notificationId = Date.now();
    
    const localNotification: LocalNotificationSchema = {
      title: notification.title,
      body: notification.body,
      id: notificationId,
      extra: notification.data,
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      iconColor: '#D4AF37', // Gold color
    };

    const options: ScheduleOptions = {
      notifications: [localNotification],
    };

    await LocalNotifications.schedule(options);
    console.log('Local notification scheduled:', notificationId);
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
};

/**
 * Schedule a local notification for later
 */
export const scheduleLocalNotification = async (
  notification: NotificationData,
  triggerAt: Date
): Promise<number | null> => {
  if (!isNative) {
    console.log('Scheduled notifications not available on web');
    return null;
  }

  try {
    const notificationId = Date.now();
    
    const localNotification: LocalNotificationSchema = {
      title: notification.title,
      body: notification.body,
      id: notificationId,
      extra: notification.data,
      schedule: {
        at: triggerAt,
      },
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      iconColor: '#D4AF37',
    };

    await LocalNotifications.schedule({
      notifications: [localNotification],
    });

    console.log('Notification scheduled for:', triggerAt);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: number): Promise<void> => {
  if (!isNative) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

/**
 * Cancel all pending notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  if (!isNative) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id })),
      });
    }
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * Setup local notification listeners
 */
export const setupLocalNotificationListeners = (
  onNotificationReceived?: (notification: LocalNotificationSchema) => void,
  onNotificationAction?: (notification: { notification: LocalNotificationSchema }) => void
) => {
  if (!isNative) return;

  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Local notification received:', notification);
    onNotificationReceived?.(notification);
  });

  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('Local notification action performed:', notification);
    onNotificationAction?.(notification);
  });
};

/**
 * Check notification permissions status
 */
export const checkNotificationPermissions = async (): Promise<{
  push: boolean;
  local: boolean;
}> => {
  if (!isNative) {
    const webPermission = 'Notification' in window ? Notification.permission === 'granted' : false;
    return { push: false, local: webPermission };
  }

  try {
    const pushPerm = await PushNotifications.checkPermissions();
    const localPerm = await LocalNotifications.checkPermissions();
    
    return {
      push: pushPerm.receive === 'granted',
      local: localPerm.display === 'granted',
    };
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return { push: false, local: false };
  }
};

/**
 * Request all notification permissions
 */
export const requestAllNotificationPermissions = async (): Promise<{
  push: boolean;
  local: boolean;
}> => {
  const [pushToken, localGranted] = await Promise.all([
    initPushNotifications(),
    initLocalNotifications(),
  ]);

  return {
    push: pushToken !== null,
    local: localGranted,
  };
};
