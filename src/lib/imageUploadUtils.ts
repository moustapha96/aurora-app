/**
 * Centralized image upload utilities
 * Ensures all images are uploaded with correct MIME types
 */

import { supabase } from '@/integrations/supabase/client';

interface UploadOptions {
  bucket: string;
  path: string;
  file: File | Blob;
  upsert?: boolean;
  cacheControl?: string;
}

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Get MIME type from file extension
 */
export const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'heic': 'image/heic',
    'heif': 'image/heif',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'txt': 'text/plain',
    'json': 'application/json',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Create a File object with proper MIME type from any file/blob
 */
export const createProperFile = (file: File | Blob, fileName?: string): { file: File; contentType: string } => {
  const name = fileName || (file instanceof File ? file.name : `file-${Date.now()}`);
  const contentType = getMimeType(name);
  
  const properFile = new File([file], name, {
    type: contentType,
    lastModified: Date.now()
  });
  
  return { file: properFile, contentType };
};

/**
 * Convert Blob/File to proper File object with correct MIME type
 */
export const ensureFileWithMimeType = (
  data: File | Blob,
  fileName: string
): File => {
  const mimeType = getMimeType(fileName);
  
  // If it's already a File with correct type, return as-is
  if (data instanceof File && data.type === mimeType) {
    return data;
  }
  
  // Create new File with proper MIME type
  const finalFileName = data instanceof File ? data.name : fileName;
  return new File([data], finalFileName, { type: mimeType });
};

/**
 * Upload image/file to Supabase storage with proper MIME type
 */
export const uploadToStorage = async ({
  bucket,
  path,
  file,
  upsert = true,
  cacheControl = '3600',
}: UploadOptions): Promise<UploadResult> => {
  try {
    // Ensure we have a proper File object with correct MIME type
    const fileName = file instanceof File ? file.name : path.split('/').pop() || 'file';
    const properFile = ensureFileWithMimeType(file, fileName);
    const contentType = properFile.type;

    console.log('[Upload] Uploading to', bucket, path, 'type:', contentType);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, properFile, {
        upsert,
        contentType,
        cacheControl,
      });

    if (error) {
      console.error('[Upload] Error:', error.message);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    // Add cache buster for immediate visibility
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();
    console.log('[Upload] Success, URL:', publicUrl);

    return { success: true, publicUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Upload] Exception:', message);
    return { success: false, error: message };
  }
};

/**
 * Upload image with compression - returns public URL
 */
export const uploadImage = async (
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean; cacheControl?: string }
): Promise<string | null> => {
  const result = await uploadToStorage({
    bucket,
    path,
    file,
    ...options,
  });

  return result.success ? result.publicUrl || null : null;
};

/**
 * Get clean public URL without cache buster
 */
export const getCleanPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
