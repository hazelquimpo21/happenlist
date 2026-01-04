/**
 * IMAGE MIGRATION API
 * ===================
 * Batch migrates external images to Supabase Storage.
 * This is useful for:
 * - Migrating images scraped by the Chrome extension
 * - Fixing events with external URLs that might expire
 * - Ensuring all images are hosted locally
 * 
 * Endpoints:
 * - GET: Preview events with external images
 * - POST: Migrate images to Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { reHostImage, isHostedImage } from '@/lib/supabase/storage';

// API secret for admin operations
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || process.env.SCRAPER_API_SECRET;

/**
 * Verify admin authorization
 */
function isAuthorized(request: NextRequest): boolean {
  if (!ADMIN_API_SECRET) {
    console.warn('⚠️ No API secret configured - allowing in development');
    return process.env.NODE_ENV === 'development';
  }
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token === ADMIN_API_SECRET;
}

interface MigrationResult {
  eventId: string;
  title: string;
  imageType: 'hero' | 'thumbnail' | 'flyer';
  originalUrl: string;
  newUrl?: string;
  success: boolean;
  error?: string;
}

/**
 * GET /api/admin/migrate-images
 * 
 * Returns events that have external images (not hosted in Supabase).
 * Use this to preview what will be migrated.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    // Find events with external images
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        slug,
        instance_date,
        source,
        status,
        image_url,
        image_hosted,
        raw_image_url,
        thumbnail_url,
        thumbnail_hosted,
        flyer_url,
        flyer_hosted
      `)
      .is('deleted_at', null)
      .or('image_hosted.is.false,image_hosted.is.null')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter to only include events with truly external images
    const externalEvents = (events || []).filter(event => {
      return event.image_url && !isHostedImage(event.image_url);
    });

    // Summary stats
    const stats = {
      totalWithExternalImages: externalEvents.length,
      bySource: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    externalEvents.forEach(event => {
      const source = event.source || 'unknown';
      const status = event.status || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return NextResponse.json({
      message: 'Events with external images',
      stats,
      events: externalEvents.map(e => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        instance_date: e.instance_date,
        source: e.source,
        status: e.status,
        image_url: e.image_url,
        raw_image_url: e.raw_image_url,
        image_hosted: e.image_hosted,
      })),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/migrate-images
 * 
 * Migrates external images to Supabase Storage.
 * 
 * Body options:
 * - { eventIds: string[] } - Migrate specific events
 * - { all: true, limit?: number } - Migrate all events (with optional limit)
 * - { dryRun: true } - Preview without making changes
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventIds, all, limit = 10, dryRun = false } = body;

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        image_url,
        image_hosted,
        thumbnail_url,
        thumbnail_hosted,
        flyer_url,
        flyer_hosted
      `)
      .is('deleted_at', null);

    if (eventIds && Array.isArray(eventIds)) {
      query = query.in('id', eventIds);
    } else if (all) {
      query = query
        .or('image_hosted.is.false,image_hosted.is.null')
        .not('image_url', 'is', null)
        .limit(limit);
    } else {
      return NextResponse.json({
        error: 'Provide either { eventIds: [...] } or { all: true, limit: n }',
      }, { status: 400 });
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        message: 'No events to migrate',
        results: [],
      });
    }

    const results: MigrationResult[] = [];

    for (const event of events) {
      // Migrate hero image
      if (event.image_url && !isHostedImage(event.image_url) && !event.image_hosted) {
        if (dryRun) {
          results.push({
            eventId: event.id,
            title: event.title,
            imageType: 'hero',
            originalUrl: event.image_url,
            success: true,
            newUrl: '[DRY RUN - would migrate]',
          });
        } else {
          console.log(`📤 Migrating hero image for: ${event.title}`);
          
          const uploadResult = await reHostImage(event.image_url, event.id, 'hero');
          
          if (uploadResult.success && uploadResult.url) {
            // Update the event with the new hosted URL
            const { error: updateError } = await supabase
              .from('events')
              .update({
                image_url: uploadResult.url,
                image_storage_path: uploadResult.path,
                image_hosted: true,
                raw_image_url: event.image_url, // Keep original as raw
              })
              .eq('id', event.id);

            results.push({
              eventId: event.id,
              title: event.title,
              imageType: 'hero',
              originalUrl: event.image_url,
              newUrl: uploadResult.url,
              success: !updateError,
              error: updateError?.message,
            });

            if (!updateError) {
              console.log(`✅ Migrated: ${event.title}`);
            }
          } else {
            results.push({
              eventId: event.id,
              title: event.title,
              imageType: 'hero',
              originalUrl: event.image_url,
              success: false,
              error: uploadResult.error,
            });
            console.error(`❌ Failed: ${event.title} - ${uploadResult.error}`);
          }
        }
      }

      // Migrate thumbnail if exists and not hosted
      if (event.thumbnail_url && !isHostedImage(event.thumbnail_url) && !event.thumbnail_hosted) {
        if (dryRun) {
          results.push({
            eventId: event.id,
            title: event.title,
            imageType: 'thumbnail',
            originalUrl: event.thumbnail_url,
            success: true,
            newUrl: '[DRY RUN - would migrate]',
          });
        } else {
          const uploadResult = await reHostImage(event.thumbnail_url, event.id, 'thumbnail');
          
          if (uploadResult.success && uploadResult.url) {
            await supabase
              .from('events')
              .update({
                thumbnail_url: uploadResult.url,
                thumbnail_storage_path: uploadResult.path,
                thumbnail_hosted: true,
              })
              .eq('id', event.id);
          }

          results.push({
            eventId: event.id,
            title: event.title,
            imageType: 'thumbnail',
            originalUrl: event.thumbnail_url,
            newUrl: uploadResult.url,
            success: uploadResult.success,
            error: uploadResult.error,
          });
        }
      }

      // Migrate flyer if exists and not hosted
      if (event.flyer_url && !isHostedImage(event.flyer_url) && !event.flyer_hosted) {
        if (dryRun) {
          results.push({
            eventId: event.id,
            title: event.title,
            imageType: 'flyer',
            originalUrl: event.flyer_url,
            success: true,
            newUrl: '[DRY RUN - would migrate]',
          });
        } else {
          const uploadResult = await reHostImage(event.flyer_url, event.id, 'flyer');
          
          if (uploadResult.success && uploadResult.url) {
            await supabase
              .from('events')
              .update({
                flyer_url: uploadResult.url,
                flyer_storage_path: uploadResult.path,
                flyer_hosted: true,
              })
              .eq('id', event.id);
          }

          results.push({
            eventId: event.id,
            title: event.title,
            imageType: 'flyer',
            originalUrl: event.flyer_url,
            newUrl: uploadResult.url,
            success: uploadResult.success,
            error: uploadResult.error,
          });
        }
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: dryRun ? 'Dry run complete' : 'Migration complete',
      dryRun,
      summary: {
        total: results.length,
        successful,
        failed,
      },
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

