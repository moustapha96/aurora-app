/**
 * Image compression utilities
 * Optimized for Android, iOS, and Web
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CompressionResult {
  blob: Blob;
  file: File;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file before upload
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    type = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use better quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type,
              lastModified: Date.now(),
            });

            const url = URL.createObjectURL(blob);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const compressionRatio = (1 - compressedSize / originalSize) * 100;

            resolve({
              blob,
              file: compressedFile,
              url,
              width,
              height,
              originalSize,
              compressedSize,
              compressionRatio,
            });
          },
          type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress multiple images in parallel
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  return Promise.all(files.map((file) => compressImage(file, options)));
};

/**
 * Generate thumbnail from image
 */
export const generateThumbnail = async (
  file: File,
  size: number = 150
): Promise<CompressionResult> => {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    type: 'image/jpeg',
  });
};

/**
 * Check if file needs compression
 */
export const needsCompression = (
  file: File,
  maxSizeBytes: number = 500 * 1024 // 500KB default
): boolean => {
  return file.size > maxSizeBytes;
};

/**
 * Smart compression based on file size
 */
export const smartCompress = async (
  file: File,
  options: CompressionOptions & { maxSizeBytes?: number } = {}
): Promise<CompressionResult | null> => {
  const { maxSizeBytes = 500 * 1024, ...compressionOptions } = options;

  // Skip compression for small files
  if (!needsCompression(file, maxSizeBytes)) {
    return null;
  }

  // Progressive quality reduction for very large files
  let quality = compressionOptions.quality || 0.8;
  if (file.size > 5 * 1024 * 1024) quality = 0.6; // > 5MB
  else if (file.size > 2 * 1024 * 1024) quality = 0.7; // > 2MB

  return compressImage(file, { ...compressionOptions, quality });
};

/**
 * Revoke object URL to free memory
 */
export const revokeImageUrl = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Convert base64 to File
 */
export const base64ToFile = (
  base64: string,
  filename: string,
  mimeType: string = 'image/jpeg'
): File => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  const blob = new Blob([ab], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
};

/**
 * File to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
