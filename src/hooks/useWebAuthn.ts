import { useState, useEffect, useCallback } from 'react';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerWebAuthn,
  authenticateWebAuthn,
  getStoredCredentials,
  deleteCredential,
  checkWebAuthnEnabled,
  getBiometricCapabilities,
  getBiometricName,
  detectBiometricType,
  BiometricType,
  BiometricCapabilities,
} from '@/services/webAuthnService';
import { supabase } from '@/integrations/supabase/client';

interface WebAuthnCredential {
  id: string;
  credential_id: string;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

export const useWebAuthn = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      // Check support and capabilities
      const caps = await getBiometricCapabilities();
      setCapabilities(caps);
      setIsSupported(caps.isSupported);
      setIsPlatformAvailable(caps.isPlatformAvailable);
      setBiometricType(caps.biometricType);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
        
        // Check if enabled
        const enabled = await checkWebAuthnEnabled(user.id);
        setIsEnabled(enabled);
        
        // Load credentials
        const creds = await getStoredCredentials(user.id);
        setCredentials(creds);
      }
      
      setIsLoading(false);
    };

    init();
  }, []);

  // Register new biometric
  const register = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !userEmail) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    const result = await registerWebAuthn(userId, userEmail);
    
    if (result.success) {
      setIsEnabled(true);
      const creds = await getStoredCredentials(userId);
      setCredentials(creds);
    }
    
    return result;
  }, [userId, userEmail]);

  // Authenticate with biometric
  const authenticate = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    return await authenticateWebAuthn(userId);
  }, [userId]);

  // Remove a credential
  const removeCredential = useCallback(async (credentialId: string): Promise<boolean> => {
    if (!userId) return false;

    const success = await deleteCredential(credentialId, userId);
    
    if (success) {
      const creds = await getStoredCredentials(userId);
      setCredentials(creds);
      setIsEnabled(creds.length > 0);
    }
    
    return success;
  }, [userId]);

  // Refresh credentials
  const refreshCredentials = useCallback(async () => {
    if (!userId) return;
    
    const creds = await getStoredCredentials(userId);
    setCredentials(creds);
    setIsEnabled(creds.length > 0);
  }, [userId]);

  // Get biometric name for display
  const getBiometricDisplayName = useCallback(() => {
    return getBiometricName(biometricType);
  }, [biometricType]);

  return {
    isSupported,
    isPlatformAvailable,
    isEnabled,
    credentials,
    isLoading,
    biometricType,
    capabilities,
    register,
    authenticate,
    removeCredential,
    refreshCredentials,
    getBiometricDisplayName,
  };
};
