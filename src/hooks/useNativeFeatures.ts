/**
 * Hook for accessing native mobile features
 * Provides easy access to Capacitor plugins with fallbacks for web
 */

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { haptics, camera, secureStorage } from '@/lib/capacitor';
import { useNotifications } from '@/hooks/useNotifications';

export function useNativeFeatures() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Notifications
  const notifications = useNotifications();

  // Camera functionality
  const [cameraLoading, setCameraLoading] = useState(false);

  const takePicture = useCallback(async (): Promise<string | null> => {
    if (cameraLoading) return null;
    setCameraLoading(true);
    try {
      const result = await camera.takePicture();
      return result;
    } finally {
      setCameraLoading(false);
    }
  }, [cameraLoading]);

  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    if (cameraLoading) return null;
    setCameraLoading(true);
    try {
      const result = await camera.pickFromGallery();
      return result;
    } finally {
      setCameraLoading(false);
    }
  }, [cameraLoading]);

  // Haptic feedback
  const vibrate = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    await haptics.impact(style);
  }, []);

  const notificationFeedback = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    await haptics.notification(type);
  }, []);

  // Secure storage
  const saveSecure = useCallback(async (key: string, value: string) => {
    await secureStorage.set(key, value);
  }, []);

  const getSecure = useCallback(async (key: string): Promise<string | null> => {
    return await secureStorage.get(key);
  }, []);

  const removeSecure = useCallback(async (key: string) => {
    await secureStorage.remove(key);
  }, []);

  // Share functionality
  const share = useCallback(async (data: { title?: string; text?: string; url?: string }) => {
    if (navigator.share && isNative) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.log('Share cancelled or failed:', error);
        return false;
      }
    }
    // Fallback: copy to clipboard
    const textToCopy = data.url || data.text || data.title || '';
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    }
    return false;
  }, [isNative]);

  return {
    isNative,
    platform,
    // Camera
    takePicture,
    pickFromGallery,
    cameraLoading,
    // Haptics
    vibrate,
    notificationFeedback,
    // Secure Storage
    saveSecure,
    getSecure,
    removeSecure,
    // Share
    share,
    // Notifications
    notifications,
  };
}
