import { useState, useEffect } from 'react';
import { getAvatarThumbnail } from '@/lib/imageOptimization';

/**
 * Hook to optimize avatar images, especially base64 ones
 * Converts large base64 images to smaller, optimized versions
 */
export const useOptimizedAvatar = (avatarUrl: string | null | undefined, size: number = 160) => {
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!avatarUrl) {
      setIsLoading(false);
      return;
    }

    // If it's a Supabase Storage URL, use the optimization function
    if (!avatarUrl.startsWith('data:')) {
      setOptimizedUrl(getAvatarThumbnail(avatarUrl));
      setIsLoading(false);
      return;
    }

    // For base64 images, optimize them client-side
    const optimizeBase64 = async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setOptimizedUrl(avatarUrl);
            setIsLoading(false);
            return;
          }

          // Calculate dimensions maintaining aspect ratio
          const aspectRatio = img.width / img.height;
          let width = size;
          let height = size;
          
          if (aspectRatio > 1) {
            height = size / aspectRatio;
          } else {
            width = size * aspectRatio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to optimized base64 with lower quality
          const optimized = canvas.toDataURL('image/jpeg', 0.7);
          setOptimizedUrl(optimized);
          setIsLoading(false);
        };

        img.onerror = () => {
          setOptimizedUrl(null);
          setIsLoading(false);
        };

        img.src = avatarUrl;
      } catch (error) {
        console.error('Error optimizing avatar:', error);
        setOptimizedUrl(null);
        setIsLoading(false);
      }
    };

    optimizeBase64();
  }, [avatarUrl, size]);

  return { optimizedUrl, isLoading };
};
