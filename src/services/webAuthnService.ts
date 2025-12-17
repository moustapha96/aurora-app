// WebAuthn Service for Web-based Biometric Authentication
// Supports Touch ID (Mac), Face ID (Mac/iOS), Windows Hello, Fingerprint readers

import { supabase } from "@/integrations/supabase/client";

const RP_NAME = "Aurora Society";

export type BiometricType = 'touchId' | 'faceId' | 'windowsHello' | 'fingerprint' | 'unknown' | 'none';

export interface BiometricCapabilities {
  isSupported: boolean;
  isPlatformAvailable: boolean;
  biometricType: BiometricType;
  deviceName: string;
  browserName: string;
}

// Check if WebAuthn is supported
export const isWebAuthnSupported = (): boolean => {
  return !!(window.PublicKeyCredential && 
    navigator.credentials && 
    typeof navigator.credentials.create === 'function');
};

// Check if platform authenticator (biometric) is available
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};

// Detect browser name
const getBrowserName = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
  
  return 'Navigateur';
};

// Detect biometric type based on platform
export const detectBiometricType = (): BiometricType => {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // macOS - Touch ID
  if (platform.includes('mac') || ua.includes('macintosh')) {
    return 'touchId';
  }
  
  // Windows - Windows Hello
  if (platform.includes('win') || ua.includes('windows')) {
    return 'windowsHello';
  }
  
  // iOS - Face ID or Touch ID
  if (/iphone|ipad|ipod/.test(ua)) {
    // iPhone X and newer use Face ID
    const isIphoneX = window.screen.height >= 812 && window.devicePixelRatio >= 3;
    return isIphoneX ? 'faceId' : 'touchId';
  }
  
  // Android - Fingerprint
  if (ua.includes('android')) {
    return 'fingerprint';
  }
  
  // Linux or other - likely fingerprint reader if available
  if (platform.includes('linux')) {
    return 'fingerprint';
  }
  
  return 'unknown';
};

// Get device name based on user agent with more detail
export const getDeviceName = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  const browser = getBrowserName();
  
  if (ua.includes('macintosh') || ua.includes('mac os')) {
    return `Mac - ${browser} (Touch ID)`;
  }
  
  if (ua.includes('windows')) {
    const version = ua.match(/windows nt (\d+\.\d+)/);
    const winVersion = version ? (version[1] === '10.0' ? '10/11' : version[1]) : '';
    return `Windows ${winVersion} - ${browser} (Hello)`;
  }
  
  if (ua.includes('iphone')) {
    return `iPhone - ${browser} (Face ID/Touch ID)`;
  }
  
  if (ua.includes('ipad')) {
    return `iPad - ${browser} (Touch ID)`;
  }
  
  if (ua.includes('android')) {
    const brandMatch = ua.match(/android.*?([a-z]+)\s*build/i);
    const brand = brandMatch ? brandMatch[1] : 'Android';
    return `${brand} - ${browser} (Empreinte)`;
  }
  
  if (ua.includes('linux')) {
    return `Linux - ${browser} (Empreinte)`;
  }
  
  return `Appareil - ${browser}`;
};

// Get human-readable biometric name
export const getBiometricName = (type: BiometricType): string => {
  switch (type) {
    case 'touchId': return 'Touch ID';
    case 'faceId': return 'Face ID';
    case 'windowsHello': return 'Windows Hello';
    case 'fingerprint': return 'Empreinte digitale';
    default: return 'Biométrie';
  }
};

// Get full biometric capabilities for the current device
export const getBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  const isSupported = isWebAuthnSupported();
  const isPlatformAvailable = isSupported ? await isPlatformAuthenticatorAvailable() : false;
  const biometricType = isPlatformAvailable ? detectBiometricType() : 'none';
  
  return {
    isSupported,
    isPlatformAvailable,
    biometricType,
    deviceName: getDeviceName(),
    browserName: getBrowserName(),
  };
};

// Generate a random challenge
const generateChallenge = (): ArrayBuffer => {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge.buffer as ArrayBuffer;
};

// Convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Register a new WebAuthn credential (setup biometric)
export const registerWebAuthn = async (userId: string, userEmail: string): Promise<{ success: boolean; error?: string }> => {
  if (!isWebAuthnSupported()) {
    return { success: false, error: "WebAuthn n'est pas supporté sur ce navigateur" };
  }

  try {
    const challenge = generateChallenge();
    
    // Get current origin for RP ID - handle localhost specially
    let rpId = window.location.hostname;
    
    // For localhost development, we need special handling
    if (rpId === 'localhost' || rpId === '127.0.0.1') {
      rpId = 'localhost';
    }
    
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: RP_NAME,
        id: rpId,
      },
      user: {
        id: new TextEncoder().encode(userId).buffer as ArrayBuffer,
        name: userEmail,
        displayName: userEmail.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },   // ES256 (most common)
        { alg: -257, type: "public-key" }, // RS256
        { alg: -37, type: "public-key" },  // PS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Use built-in authenticator (Touch ID, Face ID, Windows Hello)
        userVerification: "required",
        residentKey: "preferred",
        requireResidentKey: false,
      },
      timeout: 120000, // 2 minutes
      attestation: "none",
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: "Échec de la création des identifiants" };
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    
    // Store credential in database
    const credentialId = arrayBufferToBase64(credential.rawId);
    const publicKey = arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0));
    
    // Detect device name
    const deviceName = getDeviceName();

    const { error: insertError } = await supabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        device_name: deviceName,
      });

    if (insertError) {
      console.error('Error storing credential:', insertError);
      return { success: false, error: "Erreur lors de l'enregistrement" };
    }

    // Enable WebAuthn on profile
    await supabase
      .from('profiles')
      .update({ webauthn_enabled: true })
      .eq('id', userId);

    return { success: true };
  } catch (error: any) {
    console.error('WebAuthn registration error:', error);
    
    if (error.name === 'NotAllowedError') {
      return { success: false, error: "Authentification annulée par l'utilisateur" };
    }
    if (error.name === 'SecurityError') {
      return { success: false, error: "Erreur de sécurité - HTTPS requis" };
    }
    if (error.name === 'InvalidStateError') {
      return { success: false, error: "Cet appareil est déjà enregistré" };
    }
    if (error.name === 'NotSupportedError') {
      return { success: false, error: "Ce type d'authentification n'est pas supporté" };
    }
    
    return { success: false, error: error.message || "Erreur lors de l'enregistrement biométrique" };
  }
};

// Authenticate using WebAuthn (verify biometric)
export const authenticateWebAuthn = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!isWebAuthnSupported()) {
    return { success: false, error: "WebAuthn n'est pas supporté sur ce navigateur" };
  }

  try {
    // Get stored credentials for user
    const { data: credentials, error: fetchError } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', userId);

    if (fetchError || !credentials || credentials.length === 0) {
      return { success: false, error: "Aucun identifiant biométrique enregistré" };
    }

    const challenge = generateChallenge();
    let rpId = window.location.hostname;
    
    if (rpId === 'localhost' || rpId === '127.0.0.1') {
      rpId = 'localhost';
    }

    const allowCredentials: PublicKeyCredentialDescriptor[] = credentials.map(cred => ({
      type: "public-key" as const,
      id: base64ToArrayBuffer(cred.credential_id),
      transports: ["internal" as AuthenticatorTransport],
    }));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId,
      allowCredentials,
      userVerification: "required",
      timeout: 120000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: "Échec de l'authentification" };
    }

    // Update last used timestamp
    const usedCredentialId = arrayBufferToBase64(assertion.rawId);
    await supabase
      .from('webauthn_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('credential_id', usedCredentialId);

    return { success: true };
  } catch (error: any) {
    console.error('WebAuthn authentication error:', error);
    
    if (error.name === 'NotAllowedError') {
      return { success: false, error: "Authentification annulée ou échouée" };
    }
    if (error.name === 'SecurityError') {
      return { success: false, error: "Erreur de sécurité" };
    }
    
    return { success: false, error: error.message || "Erreur d'authentification biométrique" };
  }
};

// Get stored credentials for a user
export const getStoredCredentials = async (userId: string) => {
  const { data, error } = await supabase
    .from('webauthn_credentials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching credentials:', error);
    return [];
  }

  return data || [];
};

// Delete a credential
export const deleteCredential = async (credentialId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('webauthn_credentials')
    .delete()
    .eq('id', credentialId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting credential:', error);
    return false;
  }

  // Check if user has any remaining credentials
  const remaining = await getStoredCredentials(userId);
  if (remaining.length === 0) {
    await supabase
      .from('profiles')
      .update({ webauthn_enabled: false })
      .eq('id', userId);
  }

  return true;
};

// Check if user has WebAuthn enabled
export const checkWebAuthnEnabled = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('profiles')
    .select('webauthn_enabled')
    .eq('id', userId)
    .single();

  return data?.webauthn_enabled || false;
};

// Check if current device has credential registered for user
export const hasCredentialForCurrentDevice = async (userId: string): Promise<boolean> => {
  const credentials = await getStoredCredentials(userId);
  const currentDevice = getDeviceName();
  
  // Check if any credential matches similar device pattern
  return credentials.some(cred => {
    const storedDevice = cred.device_name?.toLowerCase() || '';
    const current = currentDevice.toLowerCase();
    
    // Match by platform type
    if (storedDevice.includes('mac') && current.includes('mac')) return true;
    if (storedDevice.includes('windows') && current.includes('windows')) return true;
    if (storedDevice.includes('iphone') && current.includes('iphone')) return true;
    if (storedDevice.includes('ipad') && current.includes('ipad')) return true;
    if (storedDevice.includes('android') && current.includes('android')) return true;
    
    return false;
  });
};
