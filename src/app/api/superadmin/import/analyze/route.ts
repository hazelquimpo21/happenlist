/**
 * SUPERADMIN IMPORT — ANALYZE
 * ============================
 * Server-side proxy that calls the Render-hosted scraper backend to analyze
 * a URL or a block of pasted text.
 *
 * Why proxy it instead of calling the scraper directly from the browser?
 * 1. The scraper's `X-API-Secret` lives in server env vars — never ship to the client.
 * 2. We can add logging, quota enforcement, and auth (superadmin-only) here.
 *
 * Request:
 *   POST { mode: 'url', url: string, hint?: string }
 *   POST { mode: 'text', text: string, sourceUrl?: string, hint?: string }
 *
 * Response: the scraper's analyze response verbatim (single or multi).
 *
 * @module app/api/superadmin/import/analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/auth/is-superadmin';
import { analyzeUrl, analyzeText, ScraperClientError } from '@/lib/scraper/client';

export const runtime = 'nodejs';
// Analyze can take up to ~60s for LLM extraction.
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  const { session } = await getSession();
  if (!session || !isSuperAdmin(session.email)) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 401 });
  }

  let body: {
    mode?: 'url' | 'text';
    url?: string;
    text?: string;
    sourceUrl?: string;
    hint?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const hint = typeof body.hint === 'string' ? body.hint.slice(0, 2000) : undefined;

  try {
    if (body.mode === 'url') {
      if (typeof body.url !== 'string' || !body.url.trim()) {
        return NextResponse.json({ error: 'url is required for mode=url' }, { status: 400 });
      }
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json({ error: 'url is not a valid URL' }, { status: 400 });
      }
      console.log(`[import:analyze] mode=url by ${session.email} url=${body.url}`);
      const result = await analyzeUrl({ url: body.url, hint });
      return NextResponse.json(result);
    }

    if (body.mode === 'text') {
      if (typeof body.text !== 'string' || body.text.trim().length < 10) {
        return NextResponse.json({ error: 'text must be at least 10 characters' }, { status: 400 });
      }
      let sourceUrl: string | undefined;
      if (typeof body.sourceUrl === 'string' && body.sourceUrl.trim()) {
        try {
          new URL(body.sourceUrl);
          sourceUrl = body.sourceUrl;
        } catch {
          return NextResponse.json({ error: 'sourceUrl is not a valid URL' }, { status: 400 });
        }
      }
      console.log(`[import:analyze] mode=text by ${session.email} chars=${body.text.length} hasSourceUrl=${!!sourceUrl}`);
      const result = await analyzeText({ text: body.text, hint, sourceUrl });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'mode must be "url" or "text"' }, { status: 400 });
  } catch (err) {
    if (err instanceof ScraperClientError) {
      console.error(`[import:analyze] scraper error on ${err.endpoint}: ${err.message}`);
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return NextResponse.json(
        { error: err.message, endpoint: err.endpoint },
        { status }
      );
    }
    console.error('[import:analyze] unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
