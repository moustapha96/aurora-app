import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export type BiometryType = 'face' | 'fingerprint' | 'none';

// Dynamic import for biometric auth (only available on native platforms)
let BiometricAuth: any = null;

const loadBiometricPlugin = async () => {
  if (Capacitor.isNativePlatform() && !BiometricAuth) {
    try {
      const module = await import('@aparajita/capacitor-biometric-auth');
      BiometricAuth = module.BiometricAuth;
    } catch (error) {
      console.log('Biometric plugin not available:', error);
    }
  }
  return BiometricAuth;
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

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) return false;

      const result = await plugin.checkBiometry();
      return result.isAvailable;
    } catch (error) {
      console.error('Error checking biometry:', error);
      return false;
    }
  }

  /**
   * Get the type of biometry available
   */
  static async getBiometryType(): Promise<BiometryType> {
    if (!this.isNativePlatform()) {
      return 'none';
    }

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) return 'none';

      const result = await plugin.checkBiometry();
      
      if (!result.isAvailable) {
        return 'none';
      }

      // Check biometry types
      const types = result.biometryTypes || [];
      
      if (types.includes('faceId') || types.includes('face')) {
        return 'face';
      } else if (types.includes('touchId') || types.includes('fingerprint')) {
        return 'fingerprint';
      }
      
      return 'fingerprint'; // Default to fingerprint if available but type unknown
    } catch (error) {
      console.error('Error getting biometry type:', error);
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

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) {
        return {
          success: false,
          error: 'Plugin biométrique non disponible',
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
      await plugin.authenticate({
        reason: reasonText,
        cancelTitle: 'Annuler',
        allowDeviceCredential: false,
        iosFallbackTitle: 'Utiliser le mot de passe',
        androidTitle: 'Authentification biométrique',
        androidSubtitle: 'Aurora Society',
        androidConfirmationRequired: true,
      });

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
      console.error('Error enabling biometric:', error);
      
      // Handle user cancellation
      if (error.message?.includes('cancel') || error.code === 'userCancel') {
        return {
          success: false,
          error: 'Authentification annulée',
        };
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

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) {
        return {
          success: false,
          error: 'Plugin biométrique non disponible',
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
      await plugin.authenticate({
        reason: reasonText,
        cancelTitle: 'Annuler',
        allowDeviceCredential: false,
        iosFallbackTitle: 'Utiliser le mot de passe',
        androidTitle: 'Connexion',
        androidSubtitle: 'Aurora Society',
        androidConfirmationRequired: true,
      });

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
      console.error('Error authenticating with biometric:', error);
      
      // Handle user cancellation
      if (error.message?.includes('cancel') || error.code === 'userCancel') {
        return {
          success: false,
          error: 'Authentification annulée',
        };
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
