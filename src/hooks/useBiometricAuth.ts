import { useState, useEffect, useCallback } from 'react';
import { BiometricService, BiometryType } from '@/services/biometricService';

interface UseBiometricAuthReturn {
  isNative: boolean;
  isAvailable: boolean;
  isEnabled: boolean;
  biometryType: BiometryType;
  loading: boolean;
  authenticate: () => Promise<{ success: boolean; error?: string }>;
  checkAndAuthenticate: () => Promise<boolean>;
}

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isNative, setIsNative] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        const native = BiometricService.isNativePlatform();
        setIsNative(native);

        if (native) {
          const available = await BiometricService.isAvailable();
          setIsAvailable(available);

          if (available) {
            const type = await BiometricService.getBiometryType();
            setBiometryType(type);
            
            const enabled = await BiometricService.isBiometricEnabled();
            setIsEnabled(enabled);
          }
        }
      } catch (error) {
        console.error('Error checking biometric status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const authenticate = useCallback(async () => {
    return BiometricService.authenticate();
  }, []);

  const checkAndAuthenticate = useCallback(async (): Promise<boolean> => {
    if (!isNative || !isEnabled) {
      return false;
    }

    const result = await BiometricService.authenticate();
    return result.success;
  }, [isNative, isEnabled]);

  return {
    isNative,
    isAvailable,
    isEnabled,
    biometryType,
    loading,
    authenticate,
    checkAndAuthenticate,
  };
};
