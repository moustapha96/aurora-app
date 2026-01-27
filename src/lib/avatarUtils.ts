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
    
    // Verify file exists and has correct Content-Type (helpful for debugging)
    try {
      // Wait a bit for storage to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      const response = await fetch(cleanUrl + '?t=' + Date.now(), { method: 'HEAD' });
      if (!response.ok) {
        console.warn('[Avatar] File may not be accessible yet, status:', response.status);
      } else {
        const contentType = response.headers.get('content-type');
        console.log('[Avatar] File verified accessible. content-type:', contentType);
        if (contentType && !contentType.startsWith('image/')) {
          console.error('[Avatar] Wrong content-type detected:', contentType);
        }
      }
    } catch (e) {
      console.warn('[Avatar] Could not verify file accessibility:', e);
    }
    
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

/**
 * Adds a cache-buster to an avatar URL for display
 */
export const getAvatarDisplayUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // Skip base64 images
  if (url.startsWith('data:')) return null;
  
  const cleanUrl = cleanAvatarUrl(url);
  return `${cleanUrl}?t=${Date.now()}`;
};

/**
 * Dispatches the avatar-updated event for real-time sync across components
 */
export const dispatchAvatarUpdate = (avatarUrl: string, userId: string): void => {
  window.dispatchEvent(new CustomEvent('avatar-updated', {
    detail: { avatarUrl: cleanAvatarUrl(avatarUrl), userId }
  }));
};
