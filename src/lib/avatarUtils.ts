import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads an avatar image to Supabase Storage with a standardized path.
 * Always uses PNG format and fixed filename for cache consistency.
 * 
 * @param userId - The user's ID
 * @param imageSource - Either a File, Blob, or base64 data URL string
 * @returns The clean public URL (without cache-buster) or null if upload fails
 */
export const uploadAvatar = async (
  userId: string,
  imageSource: File | Blob | string
): Promise<string | null> => {
  try {
    console.log('[Avatar] Starting upload for user:', userId);
    
    // Convert to PNG blob
    const pngBlob = await convertToPngBlob(imageSource);
    console.log('[Avatar] Converted to PNG, size:', pngBlob.size, 'type:', pngBlob.type);

    // Fixed path for consistency
    const filePath = `${userId}/avatar.png`;

    // First, delete existing file to ensure clean upload
    try {
      await supabase.storage.from('avatars').remove([filePath]);
      console.log('[Avatar] Deleted old file');
    } catch (e) {
      console.log('[Avatar] No existing file to delete');
    }

    // Create a proper Blob with explicit MIME type
    // This ensures the storage service receives the correct content-type
    const typedBlob = new Blob([pngBlob], { type: 'image/png' });
    
    console.log('[Avatar] Created Blob:', 'type:', typedBlob.type, 'size:', typedBlob.size);

    // Upload with explicit content type
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, typedBlob, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '60',
      });

    if (uploadError) {
      console.error('[Avatar] Upload error:', uploadError.message);
      console.error('[Avatar] Error details:', uploadError);
      return null;
    }

    console.log('[Avatar] Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error('[Avatar] Failed to get public URL');
      return null;
    }

    const cleanUrl = cleanAvatarUrl(urlData.publicUrl);
    console.log('[Avatar] Final clean URL:', cleanUrl);
    // L’affichage utilise une URL signée (getSignedAvatarDisplayUrl) pour obtenir le fichier image,
    // car l’URL publique peut renvoyer du JSON métadonnées au lieu du binaire.
    return cleanUrl;
  } catch (error) {
    console.error('[Avatar] Error in uploadAvatar:', error);
    return null;
  }
};

/**
 * Converts various image sources to a PNG Blob
 */
const convertToPngBlob = async (source: File | Blob | string): Promise<Blob> => {
  // If it's already a Blob/File, convert via canvas
  if (source instanceof Blob) {
    return await blobToPng(source);
  }
  
  // If it's a base64 string or data URL
  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      return await base64ToPng(source);
    }
    // If it's a regular URL, fetch it first
    const response = await fetch(source);
    const blob = await response.blob();
    return await blobToPng(blob);
  }
  
  throw new Error('Invalid image source');
};

/**
 * Converts a Blob to PNG format using canvas
 */
const blobToPng = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('Failed to convert to PNG'));
        }
      }, 'image/png', 0.9);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Converts a base64 data URL to PNG Blob
 */
const base64ToPng = async (base64: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('Failed to convert to PNG'));
        }
      }, 'image/png', 0.9);
    };
    
    img.onerror = () => reject(new Error('Failed to load base64 image'));
    img.src = base64;
  });
};

/**
 * Removes query parameters from avatar URL
 */
export const cleanAvatarUrl = (url: string): string => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    urlObj.search = '';
    return urlObj.toString();
  } catch {
    return url.split('?')[0];
  }
};

/** Extrait le chemin dans le bucket (ex: "userId/avatar.png") depuis une URL publique Supabase avatars */
export const getAvatarStoragePathFromPublicUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  const clean = cleanAvatarUrl(url).trim();
  if (!clean) return null;
  // Format: https://xxx.supabase.co/storage/v1/object/public/avatars/USER_ID/avatar.png
  const match = clean.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
  return match ? match[1] : null;
};

/** Indique si l'URL est une URL publique Supabase avatars (souvent renvoie du JSON au lieu du fichier) */
export const isSupabasePublicAvatarUrl = (url: string | null | undefined): boolean => {
  return !!url && typeof url === 'string' && url.includes('/storage/v1/object/public/avatars/');
};

/**
 * Retourne une URL d'affichage pour l'avatar.
 * Pour les URLs publiques Supabase avatars, utilise une URL signée pour obtenir le fichier image
 * (l'URL publique peut renvoyer du JSON métadonnées au lieu du binaire).
 * Sinon retourne l'URL avec cache-buster.
 */
export const getAvatarDisplayUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('data:')) return null;
  const cleanUrl = cleanAvatarUrl(url);
  return `${cleanUrl}?t=${Date.now()}`;
};

/**
 * URL signée pour afficher l'avatar (renvoie le fichier binaire, pas du JSON).
 * À utiliser pour l'affichage quand avatar_url est une URL publique Supabase avatars.
 * @param publicUrl - URL publique ou chemin (userId/avatar.png)
 * @param expiresInSeconds - validité en secondes (défaut 1h)
 */
export const getSignedAvatarDisplayUrl = async (
  publicUrl: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> => {
  if (!publicUrl) return null;
  if (publicUrl.startsWith('data:')) return null;

  let path: string | null = null;
  if (isSupabasePublicAvatarUrl(publicUrl)) {
    path = getAvatarStoragePathFromPublicUrl(publicUrl);
  } else if (!publicUrl.startsWith('http') && publicUrl.includes('/')) {
    path = publicUrl; // déjà un chemin
  }

  if (!path) return getAvatarDisplayUrl(publicUrl);

  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.warn('[Avatar] createSignedUrl failed:', error.message);
    return getAvatarDisplayUrl(publicUrl);
  }
  return data?.signedUrl ?? getAvatarDisplayUrl(publicUrl);
};

/**
 * Dispatches the avatar-updated event for real-time sync across components
 */
export const dispatchAvatarUpdate = (avatarUrl: string, userId: string): void => {
  window.dispatchEvent(new CustomEvent('avatar-updated', {
    detail: { avatarUrl: cleanAvatarUrl(avatarUrl), userId }
  }));
};
