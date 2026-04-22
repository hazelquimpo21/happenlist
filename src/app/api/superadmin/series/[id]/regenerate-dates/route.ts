/**
 * REGENERATE SERIES DATES FROM TEXT
 * ==================================
 * POST /api/superadmin/series/[id]/regenerate-dates
 *
 * Parses a plain-English or date-list description into a new set of dates,
 * diffs against the series's existing instance events, and (optionally)
 * applies the changes: add new dates, soft-cancel dropped ones, leave
 * matched ones alone.
 *
 * Typical use: the organizer sends a revised schedule. Admin pastes the new
 * list, previews what'll change, and clicks apply.
 *
 * Flow (action='preview'):
 *   1. Call scraper /analyze/text with the description.
 *   2. Collect start_datetime from each extracted event → new date set.
 *   3. Match against current instances by instance_date (YYYY-MM-DD, Chicago).
 *   4. Return { keep: [...], add: [...], drop: [...] }.
 *
 * Flow (action='apply'):
 *   Same as preview, plus:
 *   5. Insert new events, cloning fields from the first existing instance
 *      (template). Slug auto-generated per date.
 *   6. Update "drop" events to status='cancelled' (soft-delete).
 *   7. Write an audit log entry.
 *
 * Safety:
 *   - Requires at least one existing instance to serve as the template.
 *   - apply=true is explicit; preview is the default.
 *   - All work goes through the service-role admin client (RLS bypass).
 *
 * @module app/api/superadmin/series/[id]/regenerate-dates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/auth/is-superadmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyzeText, ScraperClientError } from '@/lib/scraper/client';
import { generateSlug } from '@/lib/utils/slug';

export const runtime = 'nodejs';
export const maxDuration = 90;

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface SeriesInstance {
  id: string;
  title: string;
  slug: string;
  instance_date: string; // YYYY-MM-DD
  start_datetime: string;
  end_datetime: string | null;
  status: string;
  // Template fields we clone on add:
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  location_id: string | null;
  organizer_id: string | null;
  price_type: string | null;
  price_low: number | null;
  price_high: number | null;
  price_details: string | null;
  ticket_url: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  flyer_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  registration_url: string | null;
  timezone: string | null;
  good_for: string[] | null;
  age_low: number | null;
  age_high: number | null;
  age_restriction: string | null;
  is_family_friendly: boolean | null;
  source: string;
}

interface DateDiffEntry {
  instance_date: string; // YYYY-MM-DD
  start_datetime: string; // ISO
}

interface KeepEntry extends DateDiffEntry {
  existing_event_id: string;
  existing_title: string;
}

interface DropEntry extends DateDiffEntry {
  existing_event_id: string;
  existing_title: string;
  existing_status: string;
}

interface ApplyResults {
  added: { id: string; instance_date: string }[];
  cancelled: { id: string; instance_date: string }[];
}

// ----------------------------------------------------------------------------
// HANDLER
// ----------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session } = await getSession();
  if (!session || !isSuperAdmin(session.email)) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 401 });
  }

  const { id: seriesId } = await context.params;

  let body: { description?: string; action?: 'preview' | 'apply' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const description = (body.description ?? '').trim();
  const action: 'preview' | 'apply' = body.action === 'apply' ? 'apply' : 'preview';

  if (description.length < 4) {
    return NextResponse.json({ error: 'description must be at least 4 characters' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ---- Load current instances (template + existing) ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instancesRaw, error: instancesErr } = await (supabase as any)
    .from('events')
    .select(
      'id, title, slug, instance_date, start_datetime, end_datetime, status, ' +
      'description, short_description, category_id, location_id, organizer_id, ' +
      'price_type, price_low, price_high, price_details, ticket_url, ' +
      'image_url, thumbnail_url, flyer_url, website_url, instagram_url, ' +
      'facebook_url, registration_url, timezone, good_for, age_low, age_high, ' +
      'age_restriction, is_family_friendly, source'
    )
    .eq('series_id', seriesId)
    .order('start_datetime', { ascending: true });

  if (instancesErr) {
    console.error(`[regenerate-dates:api] instances fetch failed: ${instancesErr.message}`);
    return NextResponse.json({ error: instancesErr.message }, { status: 500 });
  }

  const instances: SeriesInstance[] = (instancesRaw ?? []) as SeriesInstance[];
  if (instances.length === 0) {
    return NextResponse.json(
      { error: 'Series has no existing instances to use as a template. Add at least one event to the series first.' },
      { status: 400 }
    );
  }

  // Use the first active instance as the template for cloning. Fall back to
  // the first instance regardless of status if none are active.
  const template =
    instances.find(i => i.status === 'published' || i.status === 'pending_review') ??
    instances[0];

  console.log(
    `[regenerate-dates:api] series=${seriesId} action=${action} existing=${instances.length} by=${session.email}`
  );

  // ---- Parse description into dates via scraper /analyze/text ----
  let newDates: DateDiffEntry[] = [];
  try {
    const result = await analyzeText({ text: description });
    const events = 'events' in result && result.multi ? result.events : 'event' in result ? [result.event] : [];
    newDates = events
      .filter(ev => !!ev.start_datetime)
      .map(ev => ({
        instance_date: (ev.instance_date ?? ev.start_datetime!.split('T')[0]),
        start_datetime: ev.start_datetime!,
      }));
  } catch (err) {
    if (err instanceof ScraperClientError) {
      return NextResponse.json({ error: `Scraper: ${err.message}` }, { status: 502 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Parse failed' },
      { status: 500 }
    );
  }

  if (newDates.length === 0) {
    return NextResponse.json(
      { error: 'Could not parse any dates from the description. Try listing dates more explicitly, e.g. "April 5, May 3, June 7".' },
      { status: 422 }
    );
  }

  // De-dupe by instance_date (first occurrence wins — use its full start_datetime).
  const seen = new Set<string>();
  newDates = newDates.filter(d => {
    if (seen.has(d.instance_date)) return false;
    seen.add(d.instance_date);
    return true;
  });

  // ---- Diff ----
  const instanceByDate = new Map<string, SeriesInstance>();
  for (const inst of instances) {
    // Skip already-cancelled events from the "keep / drop" consideration;
    // they'd be dropped anyway. Keep them in the template pool only.
    if (inst.status === 'cancelled' || inst.status === 'rejected') continue;
    instanceByDate.set(inst.instance_date, inst);
  }

  const keep: KeepEntry[] = [];
  const add: DateDiffEntry[] = [];
  for (const nd of newDates) {
    const existing = instanceByDate.get(nd.instance_date);
    if (existing) {
      keep.push({
        instance_date: nd.instance_date,
        start_datetime: nd.start_datetime,
        existing_event_id: existing.id,
        existing_title: existing.title,
      });
    } else {
      add.push(nd);
    }
  }

  const newDateSet = new Set(newDates.map(d => d.instance_date));
  const drop: DropEntry[] = [];
  for (const inst of instances) {
    if (inst.status === 'cancelled' || inst.status === 'rejected') continue;
    if (!newDateSet.has(inst.instance_date)) {
      drop.push({
        instance_date: inst.instance_date,
        start_datetime: inst.start_datetime,
        existing_event_id: inst.id,
        existing_title: inst.title,
        existing_status: inst.status,
      });
    }
  }

  const diff = { keep, add, drop };

  if (action === 'preview') {
    return NextResponse.json({ success: true, action: 'preview', diff });
  }

  // ---- APPLY ----
  const results: ApplyResults = { added: [], cancelled: [] };

  // Cancel drops first (each is a single update).
  for (const d of drop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', d.existing_event_id);
    if (error) {
      console.error(`[regenerate-dates:api] cancel ${d.existing_event_id} failed: ${error.message}`);
    } else {
      results.cancelled.push({ id: d.existing_event_id, instance_date: d.instance_date });
    }
  }

  // Build new events from the template.
  if (add.length > 0) {
    const newRows = add.map((entry) => ({
      title: template.title,
      slug: generateSlug(`${template.title}-${entry.instance_date}`),
      description: template.description,
      short_description: template.short_description,
      start_datetime: entry.start_datetime,
      // Recompute end_datetime by shifting the template's end by the same
      // delta as start. Keeps duration consistent.
      end_datetime: shiftEndDatetime(template.start_datetime, template.end_datetime, entry.start_datetime),
      instance_date: entry.instance_date,
      is_all_day: false,
      timezone: template.timezone ?? 'America/Chicago',
      category_id: template.category_id,
      location_id: template.location_id,
      organizer_id: template.organizer_id,
      series_id: seriesId,
      is_series_instance: true,
      price_type: template.price_type ?? 'free',
      price_low: template.price_low,
      price_high: template.price_high,
      price_details: template.price_details,
      ticket_url: template.ticket_url,
      image_url: template.image_url,
      thumbnail_url: template.thumbnail_url,
      flyer_url: template.flyer_url,
      website_url: template.website_url,
      instagram_url: template.instagram_url,
      facebook_url: template.facebook_url,
      registration_url: template.registration_url,
      age_low: template.age_low,
      age_high: template.age_high,
      age_restriction: template.age_restriction,
      is_family_friendly: template.is_family_friendly,
      good_for: template.good_for ?? [],
      status: 'pending_review', // Created programmatically — go through review.
      source: template.source,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from('events')
      .insert(newRows)
      .select('id, instance_date');
    if (insertErr) {
      console.error(`[regenerate-dates:api] insert failed: ${insertErr.message}`);
      return NextResponse.json(
        { error: `Partial apply — drops cancelled but adds failed: ${insertErr.message}`, partial: results },
        { status: 500 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results.added = (inserted ?? []).map((r: any) => ({ id: r.id, instance_date: r.instance_date }));
  }

  // Audit log entry.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('admin_audit_log').insert({
    action: 'superadmin_regenerate_series_dates',
    entity_type: 'series',
    entity_id: seriesId,
    admin_email: session.email,
    changes: {
      added_count: results.added.length,
      cancelled_count: results.cancelled.length,
      kept_count: keep.length,
      description,
    },
    notes: `Regenerated series dates: +${results.added.length} / -${results.cancelled.length} / ${keep.length} unchanged`,
  });

  console.log(
    `[regenerate-dates:api] applied series=${seriesId} added=${results.added.length} cancelled=${results.cancelled.length} kept=${keep.length}`
  );

  return NextResponse.json({
    success: true,
    action: 'apply',
    diff,
    results,
  });
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

/**
 * Preserve the template's event duration when moving to a new start time.
 * Returns null if the template didn't have an end_datetime (all-day or open-ended).
 */
function shiftEndDatetime(
  templateStart: string,
  templateEnd: string | null,
  newStart: string
): string | null {
  if (!templateEnd) return null;
  try {
    const durationMs = new Date(templateEnd).getTime() - new Date(templateStart).getTime();
    if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
    return new Date(new Date(newStart).getTime() + durationMs).toISOString();
  } catch {
    return null;
  }
}
