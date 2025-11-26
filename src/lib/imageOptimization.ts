import { supabase } from "@/integrations/supabase/client";

/**
 * Generates an optimized image URL for Supabase Storage images
 * For base64 images, returns as-is (will need migration)
 */
export const getOptimizedImageUrl = (
  avatarUrl: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): string | null => {
  if (!avatarUrl) return null;

  // If it's a base64 image, return null to trigger fallback to initials
  if (avatarUrl.startsWith('data:')) {
    return null;
  }

  // If it's already a full URL, check if it's a Supabase storage URL
  if (avatarUrl.startsWith('http')) {
    // For Supabase storage URLs, we can add transformation parameters
    const url = new URL(avatarUrl);
    
    // Apply transformations if provided
    if (options.width) url.searchParams.set('width', options.width.toString());
    if (options.height) url.searchParams.set('height', options.height.toString());
    if (options.quality) url.searchParams.set('quality', options.quality.toString());
    
    return url.toString();
  }

  // If it's a storage path, construct the full URL with transformations
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(avatarUrl, {
      transform: {
        width: options.width || 200,
        height: options.height || 200,
        quality: options.quality || 80,
      },
    });

  return data.publicUrl;
};

/**
 * Get avatar URL optimized for list/grid views (small thumbnails)
 */
export const getAvatarThumbnail = (avatarUrl: string | null | undefined): string | null => {
  return getOptimizedImageUrl(avatarUrl, {
    width: 160,
    height: 160,
    quality: 75,
  });
};

/**
 * Get avatar URL optimized for detail views (larger display)
 */
export const getAvatarDetail = (avatarUrl: string | null | undefined): string | null => {
  return getOptimizedImageUrl(avatarUrl, {
    width: 400,
    height: 400,
    quality: 85,
  });
};
