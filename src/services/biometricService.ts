import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

// Flag to track if Android biometric is supported
let androidBiometricSupported: boolean | null = null;

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export type BiometryType = 'face' | 'fingerprint' | 'none';

// Dynamic import for biometric auth (only available on native platforms)
let BiometricAuth: any = null;
let pluginLoadAttempted = false;

const loadBiometricPlugin = async () => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  // Check if we're on Android and if biometric is known to be unsupported
  const platform = Capacitor.getPlatform();
  if (platform === 'android' && androidBiometricSupported === false) {
    return null;
  }

  // Only attempt to load once
  if (pluginLoadAttempted) {
    return BiometricAuth;
  }

  pluginLoadAttempted = true;

  try {
    const module = await import('@aparajita/capacitor-biometric-auth');
    BiometricAuth = module.BiometricAuth;
    
    // Verify the plugin is properly initialized
    if (!BiometricAuth || typeof BiometricAuth.checkBiometry !== 'function') {
      console.warn('Biometric plugin loaded but methods are not available');
      if (platform === 'android') {
        androidBiometricSupported = false;
      }
      BiometricAuth = null;
      return null;
    }
    
    // Test if the plugin works on Android by trying a safe check
    if (platform === 'android') {
      try {
        // Try to check if the plugin is actually callable
        const testResult = await BiometricAuth.checkBiometry({});
        androidBiometricSupported = true;
      } catch (testError: any) {
        // If it fails with "then()" error, mark as unsupported
        if (testError?.message?.includes('then()') || 
            testError?.message?.includes('not implemented')) {
          console.warn('Android biometric plugin not properly implemented');
          androidBiometricSupported = false;
          BiometricAuth = null;
          return null;
        }
        // Other errors might be OK (like no biometric available)
        androidBiometricSupported = true;
      }
    }
    
    return BiometricAuth;
  } catch (error: any) {
    console.log('Biometric plugin not available:', error?.message || error);
    if (platform === 'android') {
      androidBiometricSupported = false;
    }
    BiometricAuth = null;
    return null;
  }
};

export class BiometricService {
  /**
   * Check if running on native platform
   */
  static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check if biometry is available on the device
   */
  static async isAvailable(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return false;
    }

    const platform = Capacitor.getPlatform();
    
    // Early return for Android if we know it's not supported
    if (platform === 'android' && androidBiometricSupported === false) {
      return false;
    }

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) {
        return false;
      }

      // Verify the method exists before calling
      if (typeof plugin.checkBiometry !== 'function') {
        if (platform === 'android') {
          androidBiometricSupported = false;
        }
        return false;
      }

      // Ensure we're calling the method correctly for Android
      const result = await plugin.checkBiometry({});
      return result?.isAvailable === true;
    } catch (error: any) {
      // Silently handle Android implementation errors
      if (error?.message?.includes('not implemented') || 
          error?.message?.includes('then()') ||
          error?.code === 'NOT_IMPLEMENTED') {
        if (platform === 'android') {
          androidBiometricSupported = false;
        }
        // Don't log this as an error, it's expected on some Android devices
        return false;
      }
      // Only log unexpected errors
      if (!error?.message?.includes('then()')) {
        console.error('Error checking biometry:', error);
      }
      return false;
    }
  }

  /**
   * Get the type of biometry available
   * Returns 'face' for Face ID, 'fingerprint' for Touch ID/fingerprint, 'none' if unavailable
   */
  static async getBiometryType(): Promise<BiometryType> {
    if (!this.isNativePlatform()) {
      return 'none';
    }

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) return 'none';

      // Verify the method exists before calling
      if (typeof plugin.checkBiometry !== 'function') {
        console.warn('checkBiometry method not available on plugin');
        return 'none';
      }

      const result = await plugin.checkBiometry({});
      console.log('Biometry check result:', JSON.stringify(result));
      
      if (!result?.isAvailable) {
        return 'none';
      }

      // Check biometry types array (plugin returns an array of available types)
      const types = result.biometryTypes || [];
      console.log('Available biometry types:', types);
      
      // iOS Face ID detection
      if (types.some((t: string) => 
        t.toLowerCase().includes('faceid') || 
        t.toLowerCase().includes('face') ||
        t === 'faceId'
      )) {
        return 'face';
      }
      
      // iOS Touch ID or Android fingerprint detection
      if (types.some((t: string) => 
        t.toLowerCase().includes('touchid') || 
        t.toLowerCase().includes('touch') ||
        t.toLowerCase().includes('fingerprint') ||
        t === 'touchId'
      )) {
        return 'fingerprint';
      }

      // Also check the biometryType property (some plugin versions use this)
      if (result.biometryType) {
        const biometryType = result.biometryType.toString().toLowerCase();
        if (biometryType.includes('face')) {
          return 'face';
        }
        if (biometryType.includes('touch') || biometryType.includes('fingerprint')) {
          return 'fingerprint';
        }
      }
      
      // Default to fingerprint if biometry is available but type is unknown
      return 'fingerprint';
    } catch (error: any) {
      // Silently handle Android implementation errors
      if (error?.message?.includes('not implemented') || 
          error?.message?.includes('then()') ||
          error?.code === 'NOT_IMPLEMENTED') {
        const platform = Capacitor.getPlatform();
        if (platform === 'android') {
          androidBiometricSupported = false;
        }
        return 'none';
      }
      // Only log unexpected errors
      if (!error?.message?.includes('then()')) {
        console.error('Error getting biometry type:', error);
      }
      return 'none';
    }
  }

  /**
   * Check if biometric is enabled for the user
   */
  static async isBiometricEnabled(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return false;
    }

    try {
      const { value } = await Preferences.get({ key: 'biometric_enabled' });
      return value === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled:', error);
      return false;
    }
  }

  /**
   * Enable biometric for the current user
   */
  static async enableBiometric(): Promise<BiometricAuthResult> {
    if (!this.isNativePlatform()) {
      return {
        success: false,
        error: 'Biométrie disponible uniquement sur l\'application mobile',
      };
    }

    const platform = Capacitor.getPlatform();
    
    // Early return for Android if we know it's not supported
    if (platform === 'android' && androidBiometricSupported === false) {
      return {
        success: false,
        error: 'Authentification biométrique non disponible sur cet appareil Android',
      };
    }

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) {
        return {
          success: false,
          error: 'Plugin biométrique non disponible',
        };
      }

      // Verify the authenticate method exists
      if (typeof plugin.authenticate !== 'function') {
        if (platform === 'android') {
          androidBiometricSupported = false;
        }
        return {
          success: false,
          error: 'Méthode d\'authentification non disponible',
        };
      }

      // Check if biometry is available
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biométrie non disponible sur cet appareil',
        };
      }

      const biometryType = await this.getBiometryType();
      const reasonText = biometryType === 'face' 
        ? 'Activez Face ID pour vous connecter rapidement'
        : 'Activez l\'empreinte digitale pour vous connecter rapidement';

      // Request biometric authentication
      // On Android, ensure we handle the promise correctly
      const authResult = await plugin.authenticate({
        reason: reasonText,
        cancelTitle: 'Annuler',
        allowDeviceCredential: false,
        iosFallbackTitle: 'Utiliser le mot de passe',
        androidTitle: 'Authentification biométrique',
        androidSubtitle: 'Aurora Society',
        androidConfirmationRequired: true,
      });
      
      // Check if authentication was successful
      if (authResult && authResult.succeeded === false) {
        throw new Error('Authentification biométrique échouée');
      }

      // Store activation flag
      await Preferences.set({
        key: 'biometric_enabled',
        value: 'true',
      });

      // Store auth tokens securely
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && session?.refresh_token) {
        await this.storeAuthToken(session.access_token, session.refresh_token);
      }

      // Update profile in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ biometric_enabled: true })
          .eq('id', user.id);
      }

      return { success: true };
    } catch (error: any) {
      // Handle Android implementation errors silently
      if (error?.message?.includes('not implemented') || 
          error?.message?.includes('then()') ||
          error?.code === 'NOT_IMPLEMENTED') {
        const platform = Capacitor.getPlatform();
        if (platform === 'android') {
          androidBiometricSupported = false;
        }
        return {
          success: false,
          error: 'Authentification biométrique non disponible sur cet appareil',
        };
      }
      
      // Handle user cancellation
      if (error.message?.includes('cancel') || error.code === 'userCancel') {
        return {
          success: false,
          error: 'Authentification annulée',
        };
      }
      
      // Only log unexpected errors
      if (!error?.message?.includes('then()')) {
        console.error('Error enabling biometric:', error);
      }
      
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'activation de la biométrie',
      };
    }
  }

  /**
   * Disable biometric
   */
  static async disableBiometric(): Promise<void> {
    await Preferences.set({
      key: 'biometric_enabled',
      value: 'false',
    });
    await this.clearAuthTokens();

    // Update profile in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ biometric_enabled: false })
        .eq('id', user.id);
    }
  }

  /**
   * Authenticate with biometric (for login)
   */
  static async authenticate(): Promise<BiometricAuthResult> {
    if (!this.isNativePlatform()) {
      return {
        success: false,
        error: 'Biométrie disponible uniquement sur l\'application mobile',
      };
    }

    const platform = Capacitor.getPlatform();
    
    // Early return for Android if we know it's not supported
    if (platform === 'android' && androidBiometricSupported === false) {
      return {
        success: false,
        error: 'Authentification biométrique non disponible sur cet appareil Android',
      };
    }

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) {
        return {
          success: false,
          error: 'Plugin biométrique non disponible',
        };
      }

      // Verify the authenticate method exists
      if (typeof plugin.authenticate !== 'function') {
        if (platform === 'android') {
          androidBiometricSupported = false;
        }
        return {
          success: false,
          error: 'Méthode d\'authentification non disponible',
        };
      }

      // Check if biometric is enabled
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biométrie non activée',
        };
      }

      const biometryType = await this.getBiometryType();
      const reasonText = biometryType === 'face' 
        ? 'Utilisez Face ID pour vous connecter'
        : 'Utilisez votre empreinte digitale pour vous connecter';

      // Request biometric authentication
      // On Android, ensure we handle the promise correctly
      const authResult = await plugin.authenticate({
        reason: reasonText,
        cancelTitle: 'Annuler',
        allowDeviceCredential: false,
        iosFallbackTitle: 'Utiliser le mot de passe',
        androidTitle: 'Connexion',
        androidSubtitle: 'Aurora Society',
        androidConfirmationRequired: true,
      });
      
      // Check if authentication was successful
      if (authResult && authResult.succeeded === false) {
        throw new Error('Authentification biométrique échouée');
      }

      // Get stored tokens
      const tokens = await this.getAuthTokens();
      if (!tokens) {
        return {
          success: false,
          error: 'Aucun token trouvé. Veuillez vous reconnecter avec votre mot de passe.',
        };
      }

      // Restore Supabase session
      const { error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (error) {
        // Token expired, clear and request reconnection
        await this.clearAuthTokens();
        return {
          success: false,
          error: 'Session expirée. Veuillez vous reconnecter.',
        };
      }

      return { success: true };
    } catch (error: any) {
      // Handle Android implementation errors silently
      if (error?.message?.includes('not implemented') || 
          error?.message?.includes('then()') ||
          error?.code === 'NOT_IMPLEMENTED') {
        const platform = Capacitor.getPlatform();
        if (platform === 'android') {
          androidBiometricSupported = false;
        }
        return {
          success: false,
          error: 'Authentification biométrique non disponible sur cet appareil',
        };
      }
      
      // Handle user cancellation
      if (error.message?.includes('cancel') || error.code === 'userCancel') {
        return {
          success: false,
          error: 'Authentification annulée',
        };
      }
      
      // Only log unexpected errors
      if (!error?.message?.includes('then()')) {
        console.error('Error authenticating with biometric:', error);
      }
      
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'authentification biométrique',
      };
    }
  }

  /**
   * Store auth tokens securely
   */
  private static async storeAuthToken(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'auth_access_token',
        value: accessToken,
      });
      await Preferences.set({
        key: 'auth_refresh_token',
        value: refreshToken,
      });
    } catch (error) {
      console.error('Error storing auth tokens:', error);
      throw error;
    }
  }

  /**
   * Get stored auth tokens
   */
  private static async getAuthTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const accessTokenResult = await Preferences.get({ key: 'auth_access_token' });
      const refreshTokenResult = await Preferences.get({ key: 'auth_refresh_token' });

      if (!accessTokenResult.value || !refreshTokenResult.value) {
        return null;
      }

      return {
        accessToken: accessTokenResult.value,
        refreshToken: refreshTokenResult.value,
      };
    } catch (error) {
      console.error('Error getting auth tokens:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens
   */
  private static async clearAuthTokens(): Promise<void> {
    try {
      await Preferences.remove({ key: 'auth_access_token' });
      await Preferences.remove({ key: 'auth_refresh_token' });
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }

  /**
   * Update stored tokens after successful login
   */
  static async updateStoredTokens(): Promise<void> {
    if (!this.isNativePlatform()) return;
    
    const isEnabled = await this.isBiometricEnabled();
    if (!isEnabled) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && session?.refresh_token) {
      await this.storeAuthToken(session.access_token, session.refresh_token);
    }
  }
}
