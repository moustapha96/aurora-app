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
    // Convert to PNG blob
    const pngBlob = await convertToPngBlob(imageSource);
    
    // Fixed path for consistency
    const filePath = `${userId}/avatar.png`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, pngBlob, { 
        upsert: true,
        contentType: 'image/png'
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Return clean URL without any query parameters
    return cleanAvatarUrl(publicUrl);
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
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
