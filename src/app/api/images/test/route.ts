/**
 * STORAGE TEST ENDPOINT
 * =====================
 * Tests that Supabase Storage is configured correctly.
 * 
 * GET /api/images/test - Check configuration
 * POST /api/images/test - Test upload with a sample image
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, EVENT_IMAGES_BUCKET } from '@/lib/supabase';

/**
 * GET /api/images/test
 * Check storage configuration
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error' | 'warning'; message: string }> = {};
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const scraperSecret = process.env.SCRAPER_API_SECRET;
  
  checks['NEXT_PUBLIC_SUPABASE_URL'] = supabaseUrl 
    ? { status: 'ok', message: 'Set' }
    : { status: 'error', message: 'Missing! Add to environment variables' };
    
  checks['SUPABASE_SERVICE_ROLE_KEY'] = serviceRoleKey
    ? { status: 'ok', message: 'Set (hidden for security)' }
    : { status: 'error', message: 'Missing! Get from Supabase Dashboard > Settings > API > service_role' };
    
  checks['SCRAPER_API_SECRET'] = scraperSecret
    ? { status: 'ok', message: 'Set (hidden for security)' }
    : { status: 'warning', message: 'Not set - upload endpoint will allow unauthenticated requests' };
  
  // Check bucket exists
  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createAdminClient();
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        checks['storage_access'] = { 
          status: 'error', 
          message: `Cannot access storage: ${error.message}` 
        };
      } else {
        const bucket = buckets?.find(b => b.name === EVENT_IMAGES_BUCKET);
        
        if (bucket) {
          checks['bucket'] = { 
            status: 'ok', 
            message: `Bucket "${EVENT_IMAGES_BUCKET}" exists (public: ${bucket.public})` 
          };
          
          if (!bucket.public) {
            checks['bucket_public'] = {
              status: 'error',
              message: 'Bucket is NOT public! Go to Supabase Dashboard > Storage > event-images > Settings > Make public'
            };
          }
        } else {
          checks['bucket'] = { 
            status: 'error', 
            message: `Bucket "${EVENT_IMAGES_BUCKET}" not found. Create it in Supabase Dashboard > Storage > New Bucket` 
          };
          checks['available_buckets'] = {
            status: 'warning',
            message: `Available buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}`
          };
        }
      }
    } catch (error) {
      checks['storage_access'] = { 
        status: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
  
  const hasErrors = Object.values(checks).some(c => c.status === 'error');
  
  return NextResponse.json({
    status: hasErrors ? 'not_ready' : 'ready',
    bucket: EVENT_IMAGES_BUCKET,
    checks,
    instructions: hasErrors ? {
      step1: 'Go to Supabase Dashboard > Storage',
      step2: 'Click "New Bucket"',
      step3: `Name it exactly: ${EVENT_IMAGES_BUCKET}`,
      step4: 'Check "Public bucket" checkbox',
      step5: 'Click "Create bucket"',
      step6: 'Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file',
      step7: 'Find the key in Supabase Dashboard > Settings > API > service_role (under "Project API keys")',
    } : undefined,
  });
}

/**
 * POST /api/images/test
 * Test upload with a 1x1 pixel test image
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Create a 1x1 red pixel PNG
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageBase64, 'base64');
    
    const testPath = `_test/test_${Date.now()}.png`;
    
    console.log(`🧪 Testing upload to ${EVENT_IMAGES_BUCKET}/${testPath}`);
    
    // Try to upload
    const { data, error } = await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(testPath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: error.message.includes('not found') 
          ? `Bucket "${EVENT_IMAGES_BUCKET}" doesn't exist. Create it in Supabase Dashboard > Storage`
          : error.message.includes('policy') 
            ? 'Storage policy error. Check RLS policies in Supabase.'
            : 'Check the error message for details',
      }, { status: 500 });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .getPublicUrl(testPath);
    
    // Clean up test file
    await supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .remove([testPath]);
    
    return NextResponse.json({
      success: true,
      message: 'Storage is working correctly!',
      testUrl: urlData.publicUrl,
      path: data.path,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


