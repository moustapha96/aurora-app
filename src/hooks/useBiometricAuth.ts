import { useState, useEffect, useCallback } from 'react';
import { BiometricService, BiometryType } from '@/services/biometricService';

interface UseBiometricAuthReturn {
  isNative: boolean;
  isAvailable: boolean;
  isEnabled: boolean;
  biometryType: BiometryType;
  loading: boolean;
  error: string | null;
  authenticate: () => Promise<{ success: boolean; error?: string }>;
  checkAndAuthenticate: () => Promise<boolean>;
  enable: () => Promise<{ success: boolean; error?: string }>;
  disable: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isNative, setIsNative] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const native = BiometricService.isNativePlatform();
      setIsNative(native);

      if (native) {
        console.log('useBiometricAuth: Plateforme native détectée, vérification biométrie...');
        
        try {
          const available = await BiometricService.isAvailable();
          console.log('useBiometricAuth: Biométrie disponible:', available);
          setIsAvailable(available);

          if (available) {
            const type = await BiometricService.getBiometryType();
            console.log('useBiometricAuth: Type de biométrie:', type);
            setBiometryType(type);
            
            const enabled = await BiometricService.isBiometricEnabled();
            console.log('useBiometricAuth: Biométrie activée:', enabled);
            setIsEnabled(enabled);
          } else {
            setBiometryType('none');
            setIsEnabled(false);
          }
        } catch (biometricError: any) {
          console.error('useBiometricAuth: Erreur vérification biométrie:', biometricError);
          setError(biometricError?.message || 'Erreur de vérification biométrique');
          setIsAvailable(false);
          setBiometryType('none');
          setIsEnabled(false);
        }
      } else {
        console.log('useBiometricAuth: Plateforme web détectée');
        setIsAvailable(false);
        setBiometryType('none');
        setIsEnabled(false);
      }
    } catch (err: any) {
      console.error('useBiometricAuth: Erreur générale:', err);
      setError(err?.message || 'Erreur inconnue');
      setIsAvailable(false);
      setBiometryType('none');
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const authenticate = useCallback(async () => {
    try {
      return await BiometricService.authenticate();
    } catch (err: any) {
      console.error('useBiometricAuth: Erreur authenticate:', err);
      return { success: false, error: err?.message || 'Erreur d\'authentification' };
    }
  }, []);

  const checkAndAuthenticate = useCallback(async (): Promise<boolean> => {
    if (!isNative || !isEnabled) {
      return false;
    }

    try {
      const result = await BiometricService.authenticate();
      return result.success;
    } catch (err) {
      console.error('useBiometricAuth: Erreur checkAndAuthenticate:', err);
      return false;
    }
  }, [isNative, isEnabled]);

  const enable = useCallback(async () => {
    try {
      const result = await BiometricService.enableBiometric();
      if (result.success) {
        // Refresh state after enabling
        await checkStatus();
      }
      return result;
    } catch (err: any) {
      console.error('useBiometricAuth: Erreur enable:', err);
      return { success: false, error: err?.message || 'Erreur lors de l\'activation' };
    }
  }, [checkStatus]);

  const disable = useCallback(async () => {
    try {
      await BiometricService.disableBiometric();
      // Refresh state after disabling
      await checkStatus();
    } catch (err) {
      console.error('useBiometricAuth: Erreur disable:', err);
      throw err;
    }
  }, [checkStatus]);

  const refresh = useCallback(async () => {
    await checkStatus();
  }, [checkStatus]);

  return {
    isNative,
    isAvailable,
    isEnabled,
    biometryType,
    loading,
    error,
    authenticate,
    checkAndAuthenticate,
    enable,
    disable,
    refresh,
  };
};
