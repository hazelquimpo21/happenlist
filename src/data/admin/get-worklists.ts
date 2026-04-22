/**
 * GET WORKLISTS
 * =============
 * Counts events with data-quality issues that the superadmin should clean up.
 * Powers the "Cleanup" tile on the admin dashboard + the /admin/worklists
 * pages.
 *
 * Each worklist is a narrow SQL predicate. Counts are done via HEAD requests
 * (no rows pulled) so this is cheap even on large event sets.
 *
 * WORKLIST TAXONOMY — keep this the source of truth. Adding a new list means
 * (a) adding to WORKLISTS below, (b) handling the slug in getWorklistItems().
 *
 * CROSS-FILE COUPLING:
 *  - src/app/admin/worklists/page.tsx — overview tiles
 *  - src/app/admin/worklists/[slug]/page.tsx — per-worklist event list
 *  - src/app/admin/page.tsx — dashboard tile
 */

import { createClient } from '@/lib/supabase/server';
import { adminDataLogger } from '@/lib/utils/logger';

// =============================================================================
// TAXONOMY
// =============================================================================

/**
 * Every worklist in the system. Single source of truth for slug/title/help
 * copy — both the count query and the detail page read from this.
 *
 * `predicate` is a descriptor, NOT executable SQL — it documents what the
 * query does so readers can verify the count matches the list.
 */
export const WORKLISTS = [
  {
    slug: 'missing_image',
    title: 'Missing image',
    description: 'Published events with no hero image',
    predicate: 'image_url IS NULL AND status = published',
  },
  {
    slug: 'missing_short_description',
    title: 'Missing short description',
    description: 'Published events with no card teaser (null or empty)',
    predicate: '(short_description IS NULL OR short_description = empty) AND status = published',
  },
  {
    slug: 'missing_category',
    title: 'Missing category',
    description: 'Published events with no category',
    predicate: 'category_id IS NULL AND status = published',
  },
  {
    slug: 'missing_venue',
    title: 'Missing venue',
    description: 'Published events with no location row',
    predicate: 'location_id IS NULL AND status = published',
  },
  {
    slug: 'stale_upcoming',
    title: 'Stale upcoming',
    description: 'Upcoming events not updated in 60+ days',
    predicate: 'updated_at < now()-60d AND start_datetime > now() AND status = published',
  },
  {
    slug: 'missing_price_info',
    title: 'Missing price info',
    description: 'Non-free events with no price_low set',
    predicate: 'price_type != free AND price_low IS NULL AND status = published',
  },
] as const;

export type WorklistSlug = (typeof WORKLISTS)[number]['slug'];

export interface WorklistCount {
  slug: WorklistSlug;
  title: string;
  description: string;
  count: number;
}

// =============================================================================
// COUNTS (dashboard tile)
// =============================================================================

/**
 * Fetch all worklist counts in parallel. Cheap — HEAD requests only.
 */
export async function getWorklistCounts(): Promise<WorklistCount[]> {
  const timer = adminDataLogger.time('getWorklistCounts');
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const sixtyDaysAgoIso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const missingImage = supabase
    .from('events').select('id', { count: 'exact', head: true })
    .eq('status', 'published').is('image_url', null);

  // short_description can be stored as null OR empty string — count both.
  // Supabase .or() takes a single comma-joined filter string.
  const missingShort = supabase
    .from('events').select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('short_description.is.null,short_description.eq.');

  const missingCategory = supabase
    .from('events').select('id', { count: 'exact', head: true })
    .eq('status', 'published').is('category_id', null);

  const missingVenue = supabase
    .from('events').select('id', { count: 'exact', head: true })
    .eq('status', 'published').is('location_id', null);

  const staleUpcoming = supabase
    .from('events').select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('start_datetime', nowIso)
    .lt('updated_at', sixtyDaysAgoIso);

  const missingPrice = supabase
    .from('events').select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .neq('price_type', 'free')
    .is('price_low', null);

  const results = await Promise.all([
    missingImage,
    missingShort,
    missingCategory,
    missingVenue,
    staleUpcoming,
    missingPrice,
  ]);

  const counts: WorklistCount[] = WORKLISTS.map((list, i) => ({
    slug: list.slug,
    title: list.title,
    description: list.description,
    count: results[i].count ?? 0,
  }));

  timer.success('counts fetched', {
    metadata: Object.fromEntries(counts.map(c => [c.slug, c.count])),
  });
  return counts;
}

// =============================================================================
// ITEMS (per-worklist detail page)
// =============================================================================

export interface WorklistItem {
  id: string;
  title: string;
  slug: string;
  start_datetime: string;
  status: string;
  updated_at: string | null;
  location_name: string | null;
  category_name: string | null;
  image_url: string | null;
  short_description: string | null;
  ticket_url: string | null;
  sold_out: boolean | null;
}

/**
 * Fetch the actual events in a worklist. Each slug maps to the SAME predicate
 * the count query uses — edit them together.
 */
export async function getWorklistItems(
  slug: WorklistSlug,
  limit = 100
): Promise<WorklistItem[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const sixtyDaysAgoIso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // Base selector: hydrate the joined names so the table can render without
  // a second roundtrip. Status + upcoming filters applied in each branch.
  let query = supabase
    .from('events')
    .select(`
      id, title, slug, start_datetime, status, updated_at, image_url,
      short_description, ticket_url, sold_out,
      location:locations(name),
      category:categories(name)
    `)
    .eq('status', 'published')
    .order('start_datetime', { ascending: true })
    .limit(limit);

  switch (slug) {
    case 'missing_image':
      query = query.is('image_url', null);
      break;
    case 'missing_short_description':
      query = query.or('short_description.is.null,short_description.eq.');
      break;
    case 'missing_category':
      query = query.is('category_id', null);
      break;
    case 'missing_venue':
      query = query.is('location_id', null);
      break;
    case 'stale_upcoming':
      query = query.gte('start_datetime', nowIso).lt('updated_at', sixtyDaysAgoIso);
      break;
    case 'missing_price_info':
      query = query.neq('price_type', 'free').is('price_low', null);
      break;
  }

  const { data, error } = await query;
  if (error) {
    console.error(`[worklists:${slug}] fetch failed: ${error.message}`);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    start_datetime: row.start_datetime,
    status: row.status,
    updated_at: row.updated_at,
    image_url: row.image_url,
    short_description: row.short_description,
    ticket_url: row.ticket_url,
    sold_out: row.sold_out,
    location_name: row.location?.name ?? null,
    category_name: row.category?.name ?? null,
  }));
}

/**
 * Lookup helper so pages can render the title + description without hardcoding.
 */
export function getWorklistMeta(slug: WorklistSlug) {
  return WORKLISTS.find(w => w.slug === slug);
}
