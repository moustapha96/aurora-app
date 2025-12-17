/**
 * Capacitor Native Utilities for Aurora Society
 * This file provides utilities for native mobile features
 */

import { Capacitor } from '@capacitor/core';

// Platform detection
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';
export const isWeb = platform === 'web';

/**
 * Initialize StatusBar for native platforms
 */
export const initStatusBar = async () => {
  if (!isNative) return;
  
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
    
    if (isAndroid) {
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (error) {
    console.log('StatusBar not available:', error);
  }
};

/**
 * Hide splash screen
 */
export const hideSplashScreen = async () => {
  if (!isNative) return;
  
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (error) {
    console.log('SplashScreen not available:', error);
  }
};

/**
 * Initialize app lifecycle listeners
 */
export const initAppLifecycle = async () => {
  if (!isNative) return;
  
  try {
    const { App } = await import('@capacitor/app');
    
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
      if (isActive) {
        // App came to foreground - could refresh data here
      }
    });
    
    // Handle back button on Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
    
    // Handle deep links
    App.addListener('appUrlOpen', (event) => {
      console.log('App opened with URL:', event.url);
      // Handle deep linking here
    });
  } catch (error) {
    console.log('App lifecycle not available:', error);
  }
};

/**
 * Initialize keyboard listeners
 */
export const initKeyboard = async () => {
  if (!isNative) return;
  
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.body.classList.add('keyboard-visible');
    });
    
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
      document.body.classList.remove('keyboard-visible');
    });
  } catch (error) {
    console.log('Keyboard not available:', error);
  }
};

/**
 * Secure storage using Capacitor Preferences
 */
export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value });
    } catch (error) {
      // Fallback to localStorage for web
      localStorage.setItem(key, value);
    }
  },
  
  async get(key: string): Promise<string | null> {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      // Fallback to localStorage for web
      return localStorage.getItem(key);
    }
  },
  
  async remove(key: string): Promise<void> {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key });
    } catch (error) {
      // Fallback to localStorage for web
      localStorage.removeItem(key);
    }
  },
  
  async clear(): Promise<void> {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.clear();
    } catch (error) {
      // Fallback for web - don't clear all localStorage
      console.log('Clear not available on web');
    }
  }
};

/**
 * Haptic feedback
 */
export const haptics = {
  async impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!isNative) return;
    
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  },
  
  async notification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    if (!isNative) return;
    
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error
      };
      await Haptics.notification({ type: typeMap[type] });
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  },
  
  async vibrate(duration: number = 300): Promise<void> {
    if (!isNative) return;
    
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }
};

/**
 * Camera utilities
 */
export const camera = {
  async takePicture(): Promise<string | null> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      return image.dataUrl || null;
    } catch (error) {
      console.log('Camera error:', error);
      return null;
    }
  },
  
  async pickFromGallery(): Promise<string | null> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });
      
      return image.dataUrl || null;
    } catch (error) {
      console.log('Gallery error:', error);
      return null;
    }
  },
  
  async checkPermissions(): Promise<boolean> {
    try {
      const { Camera } = await import('@capacitor/camera');
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      return true; // Assume granted on web
    }
  },
  
  async requestPermissions(): Promise<boolean> {
    try {
      const { Camera } = await import('@capacitor/camera');
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      return true; // Assume granted on web
    }
  }
};

/**
 * Initialize all native features
 */
export const initNativeFeatures = async () => {
  if (!isNative) {
    console.log('Running in web mode');
    return;
  }
  
  console.log(`Running on ${platform}`);
  
  await initStatusBar();
  await initAppLifecycle();
  await initKeyboard();
  
  // Hide splash screen after a delay to ensure app is ready
  setTimeout(async () => {
    await hideSplashScreen();
  }, 500);
};
