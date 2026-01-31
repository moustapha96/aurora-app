/**
 * Centralized storage upload utilities for family sections
 * Ensures correct RLS path patterns for all uploads
 * 
 * RLS Requirements:
 * - personal-content: path must start with {user_id}/
 * - family-documents: path must start with {user_id}/
 * - All paths use string_to_array(name, '/')[1] = auth.uid()
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the user has an active session before calling Storage.
 * Storage uploads are particularly sensitive to expired access tokens.
 */
const ensureActiveSession = async (): Promise<boolean> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('[StorageUpload] getSession error:', error.message);
    return false;
  }
  return !!data.session;
};

/**
 * Best-effort token refresh, used when Storage returns auth/RLS-like errors.
 */
const tryRefreshSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn('[StorageUpload] refreshSession error:', error.message);
      return false;
    }
    return !!data.session;
  } catch (e) {
    console.warn('[StorageUpload] refreshSession exception:', e);
    return false;
  }
};

const looksLikeAuthOrRlsError = (message?: string): boolean => {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('row-level security') ||
    m.includes('permission') ||
    m.includes('not authorized') ||
    m.includes('jwt') ||
    m.includes('token')
  );
};

// MIME types mapping for proper Content-Type
const MIME_TYPES: Record<string, string> = {
  // Images
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
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'm4a': 'audio/mp4',
  'aac': 'audio/aac',
  'flac': 'audio/flac',
  // Video
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  // Text
  'txt': 'text/plain',
  'json': 'application/json',
};

/**
 * Get MIME type from file extension
 */
export const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[ext] || 'application/octet-stream';
};

/**
 * Storage bucket types
 */
export type StorageBucket = 'personal-content' | 'family-documents' | 'business-documents' | 'network-documents' | 'avatars';

/**
 * Section types for organizing files
 */
export type FamilySection = 
  | 'commitments'      // Engagements
  | 'close'            // Famille proche
  | 'board'            // Board/Réseau clé
  | 'influential'      // Personnes marquantes
  | 'lineage'          // Lignée
  | 'heritage'         // Héritage
  | 'audio'            // Audio files
  | 'documents';       // General documents

export type BusinessSection =
  | 'main-image'
  | 'images'
  | 'projects'
  | 'bio'
  | 'achievements'
  | 'vision'
  | 'timeline'
  | 'press';

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

interface UploadOptions {
  upsert?: boolean;
  cacheControl?: string;
}

/**
 * Generate a storage path that complies with RLS policies
 * Path format: {userId}/{section}/{timestamp}.{extension}
 * 
 * @param userId - The authenticated user's ID
 * @param section - The section/category for organizing files
 * @param fileName - Original file name (for extension extraction)
 * @returns A properly formatted storage path
 */
export const generateStoragePath = (
  userId: string,
  section: FamilySection | string,
  fileName: string
): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  // Path format: {userId}/{section}/{timestamp}.{ext}
  // This ensures the first path segment is always the userId for RLS
  return `${userId}/${section}/${timestamp}.${ext}`;
};

/**
 * Upload an image to personal-content bucket
 * Automatically handles MIME type and RLS-compliant path
 * 
 * @param file - The file to upload
 * @param userId - The authenticated user's ID
 * @param section - The section category (commitments, close, board, etc.)
 * @param options - Upload options (upsert, cacheControl)
 * @returns Upload result with public URL
 */
export const uploadFamilyImage = async (
  file: File | Blob,
  userId: string,
  section: FamilySection,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Ensure we have a valid session before uploading
    // (Prevents RLS failures when the access token is expired/missing)
    const hasSession = await ensureActiveSession();
    if (!hasSession) {
      return { success: false, error: 'Not authenticated' };
    }

    const fileName = file instanceof File ? file.name : `image-${Date.now()}.jpg`;
    const storagePath = generateStoragePath(userId, section, fileName);
    const contentType = getMimeType(fileName);

    // Create a properly typed blob to ensure content-type is set correctly
    const typedBlob = new Blob([file], { type: contentType });

    console.log('[StorageUpload] Uploading to personal-content:', storagePath, 'type:', contentType);

    const doUpload = () =>
      supabase.storage
        .from('personal-content')
        .upload(storagePath, typedBlob, {
          upsert: options.upsert ?? true,
          contentType,
          cacheControl: options.cacheControl ?? '3600',
        });

    let { error } = await doUpload();

    // If token expired or session desynced, refresh once and retry
    if (error && looksLikeAuthOrRlsError(error.message)) {
      console.warn('[StorageUpload] Upload failed, attempting session refresh and retry:', error.message);
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        ({ error } = await doUpload());
      }
    }

    if (error) {
      console.error('[StorageUpload] Error:', error.message);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('personal-content')
      .getPublicUrl(storagePath);

    // Add cache buster for immediate visibility
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();
    console.log('[StorageUpload] Success, URL:', publicUrl);

    return { success: true, publicUrl, storagePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[StorageUpload] Exception:', message);
    return { success: false, error: message };
  }
};

/**
 * Upload a document to family-documents bucket
 * Automatically handles MIME type and RLS-compliant path
 * 
 * @param file - The file to upload
 * @param userId - The authenticated user's ID
 * @param section - The section category (documents, audio, etc.)
 * @param options - Upload options (upsert, cacheControl)
 * @returns Upload result with storage path (for private bucket, use signed URLs)
 */
export const uploadFamilyDocument = async (
  file: File,
  userId: string,
  section: FamilySection = 'documents',
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    const hasSession = await ensureActiveSession();
    if (!hasSession) {
      return { success: false, error: 'Not authenticated' };
    }

    const storagePath = generateStoragePath(userId, section, file.name);
    const contentType = getMimeType(file.name);

    // Create a properly typed file to ensure content-type is set correctly
    const properFile = new File([file], file.name, {
      type: contentType,
      lastModified: Date.now(),
    });

    console.log('[StorageUpload] Uploading to family-documents:', storagePath, 'type:', contentType);

    const doUpload = () =>
      supabase.storage
        .from('family-documents')
        .upload(storagePath, properFile, {
          upsert: options.upsert ?? false,
          contentType,
          cacheControl: options.cacheControl ?? '3600',
        });

    let { error } = await doUpload();

    if (error && looksLikeAuthOrRlsError(error.message)) {
      console.warn('[StorageUpload] Document upload failed, attempting session refresh and retry:', error.message);
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        ({ error } = await doUpload());
      }
    }

    if (error) {
      console.error('[StorageUpload] Error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[StorageUpload] Document uploaded successfully:', storagePath);
    return { success: true, storagePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[StorageUpload] Exception:', message);
    return { success: false, error: message };
  }
};

/**
 * Upload an audio file to family-documents bucket
 * Specialized for audio files with proper MIME type handling
 */
export const uploadFamilyAudio = async (
  file: File,
  userId: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  return uploadFamilyDocument(file, userId, 'audio', options);
};

/**
 * Get a signed URL for a private document
 * 
 * @param storagePath - The path to the file in storage
 * @param expiresIn - Expiration time in seconds (default: 1 year)
 * @returns Signed URL or null if failed
 */
export const getSignedDocumentUrl = async (
  storagePath: string,
  expiresIn: number = 60 * 60 * 24 * 365 // 1 year
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('family-documents')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error('[StorageUpload] Signed URL error:', error.message);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[StorageUpload] Exception getting signed URL:', error);
    return null;
  }
};

/**
 * Delete a file from storage
 * 
 * @param bucket - The storage bucket
 * @param storagePath - The path to the file
 * @returns True if successful, false otherwise
 */
export const deleteStorageFile = async (
  bucket: StorageBucket,
  storagePath: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      console.error('[StorageUpload] Delete error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[StorageUpload] Delete exception:', error);
    return false;
  }
};

/**
 * Generate a storage path for Business uploads
 * Path format: {userId}/business/{section}/{timestamp}-{random}.{extension}
 */
export const generateBusinessStoragePath = (
  userId: string,
  section: BusinessSection | string,
  fileName: string,
  subPath?: string
): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  // Path format: {userId}/business/{section}[/{subPath}]/{timestamp}-{random}.{ext}
  const basePath = subPath
    ? `${userId}/business/${section}/${subPath}`
    : `${userId}/business/${section}`;
  return `${basePath}/${timestamp}-${random}.${ext}`;
};

/**
 * Upload an image to personal-content bucket for Business section
 * Automatically handles MIME type, session check and RLS-compliant path
 * 
 * @param file - The file (File or Blob) to upload
 * @param userId - The authenticated user's ID
 * @param section - The business section category (main-image, images, projects, bio, etc.)
 * @param subPath - Optional sub-path (e.g., project ID)
 * @param options - Upload options (upsert, cacheControl)
 * @returns Upload result with public URL
 */
export const uploadBusinessImage = async (
  file: File | Blob,
  userId: string,
  section: BusinessSection,
  subPath?: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Ensure we have a valid session before uploading
    const hasSession = await ensureActiveSession();
    if (!hasSession) {
      return { success: false, error: 'Not authenticated' };
    }

    const fileName = file instanceof File ? file.name : `image-${Date.now()}.jpg`;
    const storagePath = generateBusinessStoragePath(userId, section, fileName, subPath);
    const contentType = getMimeType(fileName);

    // Create a properly typed blob to ensure content-type is set correctly
    const typedBlob = new Blob([file], { type: contentType });

    console.log('[StorageUpload] Uploading business image:', storagePath, 'type:', contentType);

    const doUpload = () =>
      supabase.storage
        .from('personal-content')
        .upload(storagePath, typedBlob, {
          upsert: options.upsert ?? true,
          contentType,
          cacheControl: options.cacheControl ?? '3600',
        });

    let { error } = await doUpload();

    // If token expired or session desynced, refresh once and retry
    if (error && looksLikeAuthOrRlsError(error.message)) {
      console.warn('[StorageUpload] Business image upload failed, attempting session refresh and retry:', error.message);
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        ({ error } = await doUpload());
      }
    }

    if (error) {
      console.error('[StorageUpload] Error:', error.message);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from('personal-content')
      .getPublicUrl(storagePath);

    // Add cache buster for immediate visibility
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();
    console.log('[StorageUpload] Business image success, URL:', publicUrl);

    return { success: true, publicUrl, storagePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[StorageUpload] Exception:', message);
    return { success: false, error: message };
  }
};
