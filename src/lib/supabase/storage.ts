/**
 * SUPABASE STORAGE UTILITIES
 * ==========================
 * Utilities for uploading and managing images in Supabase Storage.
 * This allows us to host images ourselves instead of linking to external URLs.
 * 
 * REQUIREMENTS:
 * 1. Create bucket "event-images" in Supabase Dashboard > Storage
 * 2. Make it a PUBLIC bucket
 * 3. Set SUPABASE_SERVICE_ROLE_KEY in environment variables
 */

import { createAdminClient } from './admin';

// Storage bucket name for event images
export const EVENT_IMAGES_BUCKET = 'event-images';

// Supported image types
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Result of an image upload operation
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Generates a unique filename for an uploaded image
 */
function generateImagePath(eventId: string, originalFilename: string, type: 'hero' | 'thumbnail' | 'flyer' = 'hero'): string {
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  // Structure: events/{eventId}/{type}_{timestamp}_{random}.{ext}
  return `events/${eventId}/${type}_${timestamp}_${random}.${extension}`;
}

/**
 * Gets the extension from a content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[contentType] || 'jpg';
}

/**
 * Downloads an image from a URL and returns it as a buffer
 */
export async function downloadImage(url: string): Promise<{
  buffer: Buffer;
  contentType: string;
  size: number;
} | null> {
  try {
    const response = await fetch(url, {
      headers: {
        // Some CDNs require a user agent
        'User-Agent': 'Mozilla/5.0 (compatible; Happenlist/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // Verify it's actually an image
    if (!contentType.startsWith('image/')) {
      console.error(`URL did not return an image: ${contentType}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      console.error(`Image too large: ${buffer.length} bytes`);
      return null;
    }
    
    return {
      buffer,
      contentType,
      size: buffer.length,
    };
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

/**
 * Uploads an image buffer to Supabase Storage
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  contentType: string,
  eventId: string,
  type: 'hero' | 'thumbnail' | 'flyer' = 'hero'
): Promise<UploadResult> {
  try {
    // Use admin client (service role) for storage operations
    const supabase = createAdminClient();
    
    // Validate content type
    if (!SUPPORTED_TYPES.includes(contentType)) {
      return { success: false, error: `Unsupported image type: ${contentType}` };
    }
    
    // Generate path
    const extension = getExtensionFromContentType(contentType);
    const path = generateImagePath(eventId, `image.${extension}`, type);
    
    console.log(`📤 Uploading to bucket "${EVENT_IMAGES_BUCKET}", path: ${path}`);
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Failed to list buckets:', bucketsError);
      return { success: false, error: `Storage access error: ${bucketsError.message}` };
    }
    
    const bucketExists = buckets?.some(b => b.name === EVENT_IMAGES_BUCKET);
    if (!bucketExists) {
      console.error(`Bucket "${EVENT_IMAGES_BUCKET}" does not exist!`);
      console.error('Available buckets:', buckets?.map(b => b.name).join(', ') || 'none');
      return { 
        success: false, 
        error: `Bucket "${EVENT_IMAGES_BUCKET}" not found. Create it in Supabase Dashboard > Storage > New Bucket. Make it PUBLIC.` 
      };
    }
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(path, buffer, {
        contentType,
        cacheControl: '31536000', // Cache for 1 year
        upsert: false,
      });
    
    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, error: `Upload failed: ${error.message}` };
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .getPublicUrl(path);
    
    console.log(`✅ Upload successful: ${urlData.publicUrl}`);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return { success: false, error: message };
  }
}

/**
 * Downloads an image from a URL and uploads it to Supabase Storage
 * This is the main function for re-hosting external images
 */
export async function reHostImage(
  sourceUrl: string,
  eventId: string,
  type: 'hero' | 'thumbnail' | 'flyer' = 'hero'
): Promise<UploadResult> {
  // Download the image
  const downloaded = await downloadImage(sourceUrl);
  
  if (!downloaded) {
    return { success: false, error: 'Failed to download image from source' };
  }
  
  // Upload to our storage
  return uploadImageBuffer(downloaded.buffer, downloaded.contentType, eventId, type);
}

/**
 * Uploads a base64 encoded image to Supabase Storage
 * Useful for images captured directly by the Chrome extension
 */
export async function uploadBase64Image(
  base64Data: string,
  eventId: string,
  type: 'hero' | 'thumbnail' | 'flyer' = 'hero'
): Promise<UploadResult> {
  try {
    // Parse the data URL
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return { success: false, error: 'Invalid base64 image data' };
    }
    
    const contentType = matches[1];
    const base64 = matches[2];
    const buffer = Buffer.from(base64, 'base64');
    
    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      return { success: false, error: `Image too large: ${buffer.length} bytes (max ${MAX_FILE_SIZE})` };
    }
    
    return uploadImageBuffer(buffer, contentType, eventId, type);
  } catch (error) {
    console.error('Base64 upload error:', error);
    return { success: false, error: 'Failed to process base64 image' };
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    const { error } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .remove([path]);
    
    if (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Deletes all images for an event
 */
export async function deleteEventImages(eventId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    // List all files in the event's folder
    const { data: files, error: listError } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .list(`events/${eventId}`);
    
    if (listError) {
      console.error('Failed to list event images:', listError);
      return false;
    }
    
    if (!files || files.length === 0) {
      return true; // No files to delete
    }
    
    // Delete all files
    const paths = files.map(f => `events/${eventId}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .remove(paths);
    
    if (deleteError) {
      console.error('Failed to delete event images:', deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete event images error:', error);
    return false;
  }
}

/**
 * Generates a Supabase Storage URL from a path
 */
export function getStorageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${EVENT_IMAGES_BUCKET}/${path}`;
}

/**
 * Checks if a URL is a Supabase Storage URL (already hosted by us)
 */
export function isHostedImage(url: string | null | undefined): boolean {
  if (!url) return false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url.includes(`${supabaseUrl}/storage/`) || 
         url.includes('supabase.co/storage/') ||
         url.includes('supabase.in/storage/');
}

