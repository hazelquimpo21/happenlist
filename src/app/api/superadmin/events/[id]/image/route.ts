/**
 * 🦸 SUPERADMIN EVENT IMAGE UPLOAD
 * =================================
 * POST /api/superadmin/events/[id]/image
 *
 * Accepts either a base64-encoded file or an external URL, uploads to
 * Supabase Storage via the existing helpers (which rename to a stable
 * `events/{id}/{type}_{ts}_{rand}.{ext}` path), then returns the **render**
 * URL with width + quality transforms baked in. Modern browsers get WebP
 * automatically via Accept-header negotiation.
 *
 * The endpoint does NOT update events.image_url itself — the form holds the
 * returned URL in its working state and writes it to the DB when the user
 * clicks Save Changes (same flow as every other field).
 *
 * Coupling: relies on `reHostImage`, `uploadBase64Image`, `toRenderUrl` from
 * `src/lib/supabase/storage.ts`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';
import { reHostImage, uploadBase64Image, toRenderUrl } from '@/lib/supabase';
import { isValidImageUrl } from '@/lib/utils';
import { superadminLogger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: eventId } = await context.params;

  try {
    let session;
    try {
      session = await requireSuperadminAuth();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const base64: string | undefined = body.base64;
    const sourceUrl: string | undefined = body.sourceUrl;

    if (!base64 && !sourceUrl) {
      return NextResponse.json(
        { success: false, error: 'Provide either base64 or sourceUrl' },
        { status: 400 }
      );
    }

    superadminLogger.info('[superadmin:image-upload] starting', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
      metadata: { mode: base64 ? 'file' : 'url' },
    });

    let result;
    if (base64) {
      result = await uploadBase64Image(base64, eventId, 'hero');
    } else {
      // sourceUrl branch — validate first to avoid storing HTML pages
      if (!isValidImageUrl(sourceUrl!)) {
        return NextResponse.json(
          {
            success: false,
            error: 'URL does not appear to be a direct image link',
          },
          { status: 400 }
        );
      }
      result = await reHostImage(sourceUrl!, eventId, 'hero');
    }

    if (!result?.success || !result.url) {
      superadminLogger.warn('[superadmin:image-upload] upload failed', {
        entityType: 'event',
        entityId: eventId,
        metadata: { error: result?.error },
      });
      return NextResponse.json(
        { success: false, error: result?.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Wrap the public URL with render transforms before returning so consumers
    // get a resized + WebP-ready URL.
    const renderUrl = toRenderUrl(result.url);

    superadminLogger.info('[superadmin:image-upload] success', {
      entityType: 'event',
      entityId: eventId,
      adminEmail: session.email,
      metadata: { path: result.path },
    });

    return NextResponse.json({
      success: true,
      url: renderUrl,
      path: result.path,
    });
  } catch (error) {
    superadminLogger.error('[superadmin:image-upload] unexpected error', error, {
      entityType: 'event',
      entityId: eventId,
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
