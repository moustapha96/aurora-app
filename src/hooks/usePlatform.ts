import { Capacitor } from '@capacitor/core';
import { haptics, camera, secureStorage } from '@/lib/capacitor';

export type Platform = 'web' | 'ios' | 'android';

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  // Native utilities
  haptics: typeof haptics;
  camera: typeof camera;
  secureStorage: typeof secureStorage;
}

export function usePlatform(): PlatformInfo {
  const platform = Capacitor.getPlatform() as Platform;
  const isNative = Capacitor.isNativePlatform();
  
  return {
    platform,
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
    // Native utilities
    haptics,
    camera,
    secureStorage,
  };
}
