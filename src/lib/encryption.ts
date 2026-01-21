/**
 * Application-layer encryption for sensitive data.
 * Uses AES-GCM for encryption with a derived key from a passphrase.
 * This provides an additional layer of protection beyond RLS.
 */

// Encryption key derived from environment - in production, use a proper secret management
const ENCRYPTION_KEY_BASE = import.meta.env.VITE_ENCRYPTION_KEY || 'aurora-secure-key-2024';

/**
 * Derives an encryption key from a base string
 */
const deriveKey = async (baseKey: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(baseKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('aurora-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a string value using AES-GCM
 * Returns a base64-encoded string with IV prepended
 */
export const encryptValue = async (value: string): Promise<string> => {
  if (!value || value.trim() === '') return '';
  
  try {
    const key = await deriveKey(ENCRYPTION_KEY_BASE);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(value)
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Return as base64 with prefix to identify encrypted values
    return 'ENC:' + btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Encryption] Failed to encrypt:', error);
    return value; // Return original on failure
  }
};

/**
 * Decrypts a base64-encoded encrypted string
 */
export const decryptValue = async (encryptedValue: string): Promise<string> => {
  if (!encryptedValue || encryptedValue.trim() === '') return '';
  
  // Check if value is encrypted (has our prefix)
  if (!encryptedValue.startsWith('ENC:')) {
    return encryptedValue; // Return as-is if not encrypted
  }
  
  try {
    const key = await deriveKey(ENCRYPTION_KEY_BASE);
    const combined = Uint8Array.from(atob(encryptedValue.slice(4)), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error);
    return ''; // Return empty on decryption failure
  }
};

/**
 * Checks if a value is encrypted
 */
export const isEncrypted = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.startsWith('ENC:');
};

/**
 * Encrypts sensitive profile data before saving
 */
export const encryptProfilePrivateData = async (data: {
  mobile_phone?: string | null;
  wealth_amount?: string | null;
}): Promise<{
  mobile_phone?: string | null;
  wealth_amount?: string | null;
}> => {
  const result: typeof data = {};
  
  if (data.mobile_phone) {
    result.mobile_phone = await encryptValue(data.mobile_phone);
  } else {
    result.mobile_phone = data.mobile_phone;
  }
  
  if (data.wealth_amount) {
    result.wealth_amount = await encryptValue(data.wealth_amount);
  } else {
    result.wealth_amount = data.wealth_amount;
  }
  
  return result;
};

/**
 * Decrypts sensitive profile data after fetching
 */
export const decryptProfilePrivateData = async (data: {
  mobile_phone?: string | null;
  wealth_amount?: string | null;
} | null): Promise<{
  mobile_phone?: string | null;
  wealth_amount?: string | null;
} | null> => {
  if (!data) return null;
  
  const result: typeof data = { ...data };
  
  if (data.mobile_phone) {
    result.mobile_phone = await decryptValue(data.mobile_phone);
  }
  
  if (data.wealth_amount) {
    result.wealth_amount = await decryptValue(data.wealth_amount);
  }
  
  return result;
};
