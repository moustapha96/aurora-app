import { useState, useCallback } from 'react';
import { compressImage, smartCompress, type CompressionResult } from '@/lib/imageCompression';

interface UseImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
  autoCompress?: boolean;
}

interface UseImageCompressionReturn {
  compress: (file: File) => Promise<CompressionResult | null>;
  compressedImage: CompressionResult | null;
  isCompressing: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for image compression
 * Works on Android, iOS, and Web
 */
export const useImageCompression = (
  options: UseImageCompressionOptions = {}
): UseImageCompressionReturn => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeBytes = 500 * 1024,
    autoCompress = true,
  } = options;

  const [compressedImage, setCompressedImage] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const compress = useCallback(async (file: File): Promise<CompressionResult | null> => {
    setIsCompressing(true);
    setError(null);

    try {
      let result: CompressionResult | null = null;

      if (autoCompress) {
        // Use smart compression that decides based on file size
        result = await smartCompress(file, {
          maxWidth,
          maxHeight,
          quality,
          maxSizeBytes,
        });

        // If no compression needed, create result from original file
        if (!result) {
          const url = URL.createObjectURL(file);
          result = {
            blob: file,
            file,
            url,
            width: 0,
            height: 0,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
          };
        }
      } else {
        // Always compress
        result = await compressImage(file, {
          maxWidth,
          maxHeight,
          quality,
        });
      }

      setCompressedImage(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Compression failed');
      setError(error);
      return null;
    } finally {
      setIsCompressing(false);
    }
  }, [maxWidth, maxHeight, quality, maxSizeBytes, autoCompress]);

  const reset = useCallback(() => {
    if (compressedImage?.url) {
      URL.revokeObjectURL(compressedImage.url);
    }
    setCompressedImage(null);
    setError(null);
  }, [compressedImage]);

  return {
    compress,
    compressedImage,
    isCompressing,
    error,
    reset,
  };
};
