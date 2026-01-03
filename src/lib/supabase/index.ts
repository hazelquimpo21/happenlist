/**
 * SUPABASE EXPORTS
 * ================
 * Central export for Supabase utilities.
 */

export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export { createAdminClient } from './admin';
export type { Database } from './types';

// Storage utilities
export {
  EVENT_IMAGES_BUCKET,
  downloadImage,
  uploadImageBuffer,
  reHostImage,
  uploadBase64Image,
  deleteImage,
  deleteEventImages,
  getStorageUrl,
  isHostedImage,
  type UploadResult,
} from './storage';
