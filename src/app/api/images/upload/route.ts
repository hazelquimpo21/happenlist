/**
 * IMAGE UPLOAD API
 * =================
 * Handles image uploads for events.
 * Supports both:
 * - URL re-hosting: Download from external URL and host in Supabase
 * - Direct upload: Upload base64 or file data directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { reHostImage, uploadBase64Image, isHostedImage } from '@/lib/supabase';
import { isValidImageUrl } from '@/lib/utils';

// Shared secret for API authentication (set in environment)
const API_SECRET = process.env.SCRAPER_API_SECRET;

/**
 * Verify the request is from an authorized source
 */
function isAuthorized(request: NextRequest): boolean {
  // If no secret is configured, allow all requests (development mode)
  if (!API_SECRET) {
    console.warn('⚠️ SCRAPER_API_SECRET not set - allowing unauthenticated uploads');
    return true;
  }
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === API_SECRET;
}

/**
 * POST /api/images/upload
 * 
 * Upload an image for an event. Supports multiple methods:
 * 
 * 1. Re-host from URL:
 *    { eventId: "abc", sourceUrl: "https://external.com/image.jpg", type: "hero" }
 * 
 * 2. Upload base64 data:
 *    { eventId: "abc", base64: "data:image/jpeg;base64,...", type: "hero" }
 * 
 * Returns:
 *    { success: true, url: "https://supabase.../image.jpg", path: "events/abc/hero_..." }
 */
export async function POST(request: NextRequest) {
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - include Authorization: Bearer <token>' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { eventId, sourceUrl, base64, type = 'hero' } = body;
    
    // Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['hero', 'thumbnail', 'flyer'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type - must be hero, thumbnail, or flyer' },
        { status: 400 }
      );
    }
    
    // Must provide either sourceUrl or base64
    if (!sourceUrl && !base64) {
      return NextResponse.json(
        { error: 'Must provide either sourceUrl or base64 image data' },
        { status: 400 }
      );
    }
    
    let result;
    
    if (base64) {
      // Upload base64 directly
      console.log(`📤 Uploading base64 image for event ${eventId}`);
      result = await uploadBase64Image(base64, eventId, type);
    } else if (sourceUrl) {
      // Check if already hosted
      if (isHostedImage(sourceUrl)) {
        return NextResponse.json({
          success: true,
          url: sourceUrl,
          message: 'Image is already hosted in Supabase Storage',
          alreadyHosted: true,
        });
      }
      
      // Validate the source URL is an actual image
      if (!isValidImageUrl(sourceUrl)) {
        return NextResponse.json(
          { 
            error: 'Invalid source URL - does not appear to be an image URL',
            hint: 'Make sure you\'re passing the actual image URL (e.g., from og:image), not the page URL',
            sourceUrl,
          },
          { status: 400 }
        );
      }
      
      // Re-host from URL
      console.log(`📤 Re-hosting image from ${sourceUrl} for event ${eventId}`);
      result = await reHostImage(sourceUrl, eventId, type);
    }
    
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Failed to upload image' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Image uploaded: ${result.url}`);
    
    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
    
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/images/upload
 * 
 * Health check / documentation endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/images/upload',
    methods: ['POST'],
    description: 'Upload images to Supabase Storage',
    usage: {
      reHost: {
        description: 'Download and re-host an image from an external URL',
        body: {
          eventId: 'string (required)',
          sourceUrl: 'string (required)',
          type: 'hero | thumbnail | flyer (optional, default: hero)',
        },
      },
      upload: {
        description: 'Upload a base64 encoded image directly',
        body: {
          eventId: 'string (required)',
          base64: 'string (required, data:image/...;base64,...)',
          type: 'hero | thumbnail | flyer (optional, default: hero)',
        },
      },
    },
    authentication: 'Bearer token in Authorization header (SCRAPER_API_SECRET)',
  });
}


