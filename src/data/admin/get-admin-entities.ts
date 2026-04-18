/**
 * GET ADMIN ENTITIES
 * ==================
 * Generic paginated/searchable fetcher for Directory entities:
 * organizers, venues, performers, membership_organizations.
 *
 * One fetcher, four entity kinds. Dispatches on {@link AdminEntityKind}:
 *   - picks the right table (via ADMIN_ENTITIES.tableName)
 *   - picks the right columns for each entity's card
 *   - counts events via the per-entity link (direct FK or join table)
 *
 * Why not one fetcher per entity? All four have the same shape
 * (name + slug + is_active + created_at + image/logo). Duplicating would
 * just mean four files drifting slowly.
 *
 * Series NOT included here — series has a dedicated fetcher
 * (get-admin-series.ts) with merge/bulk-delete concerns.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ENTITIES, type AdminEntityKind } from '@/lib/constants/admin-entities';
import { adminDataLogger } from '@/lib/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminEntityCard {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string | null;
  /** Logo/image URL (column name varies per entity: logo_url, image_url) */
  image_url: string | null;
  /** Short one-line context — city for venues, genre for performers, etc. */
  subtitle: string | null;
  /** Extra flags per entity kind (is_verified for organizers, venue_type for venues…) */
  badges: string[];
  event_count: number;
}

export interface AdminEntityActiveFilter {
  /** 'all' = include inactive. Default is 'active' only. */
  active?: 'active' | 'inactive' | 'all';
}

export interface AdminEntityFilters extends AdminEntityActiveFilter {
  search?: string;
  page?: number;
  limit?: number;
  /** Per-entity extras (e.g. `verified` for organizers, `venueType` for venues). */
  extras?: Record<string, string | undefined>;
}

export interface AdminEntityResult {
  entities: AdminEntityCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// COLUMN MAP — per-entity card shape
// ============================================================================

/**
 * For each entity kind, which DB columns to select and how to map them to
 * the AdminEntityCard shape. Centralized so new entities just add an entry.
 */
interface EntitySelectConfig {
  selectColumns: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapRow: (row: any) => Omit<AdminEntityCard, 'event_count'>;
  /** Per-entity filter predicates beyond name-search + is_active. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyExtras?: (query: any, extras: Record<string, string | undefined>) => any;
}

const SELECT_CONFIG: Record<AdminEntityKind, EntitySelectConfig> = {
  organizer: {
    selectColumns:
      'id, name, slug, description, logo_url, is_active, is_verified, is_membership_org, created_at',
    mapRow: (r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      is_active: r.is_active ?? true,
      created_at: r.created_at,
      image_url: r.logo_url,
      subtitle: r.description ? String(r.description).slice(0, 80) : null,
      badges: [
        r.is_verified ? 'verified' : null,
        r.is_membership_org ? 'membership_org' : null,
      ].filter(Boolean) as string[],
    }),
    applyExtras: (query, extras) => {
      if (extras.verified === 'true') query = query.eq('is_verified', true);
      if (extras.verified === 'false') query = query.eq('is_verified', false);
      if (extras.membership === 'true') query = query.eq('is_membership_org', true);
      return query;
    },
  },
  venue: {
    selectColumns:
      'id, name, slug, city, state, venue_type, image_url, is_active, created_at',
    mapRow: (r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      is_active: r.is_active ?? true,
      created_at: r.created_at,
      image_url: r.image_url,
      subtitle: [r.city, r.state].filter(Boolean).join(', ') || null,
      badges: [r.venue_type].filter(Boolean),
    }),
    applyExtras: (query, extras) => {
      if (extras.venueType) query = query.eq('venue_type', extras.venueType);
      if (extras.city) query = query.ilike('city', `%${extras.city}%`);
      return query;
    },
  },
  performer: {
    selectColumns: 'id, name, slug, genre, image_url, is_active, created_at',
    mapRow: (r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      is_active: r.is_active ?? true,
      created_at: r.created_at,
      image_url: r.image_url,
      subtitle: r.genre,
      badges: [],
    }),
    applyExtras: (query, extras) => {
      if (extras.genre) query = query.ilike('genre', `%${extras.genre}%`);
      return query;
    },
  },
  membership_org: {
    selectColumns: 'id, name, slug, description, logo_url, organizer_id, is_active, created_at',
    mapRow: (r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      is_active: r.is_active ?? true,
      created_at: r.created_at,
      image_url: r.logo_url,
      subtitle: r.description ? String(r.description).slice(0, 80) : null,
      badges: [],
    }),
  },
};

// ============================================================================
// FETCHER
// ============================================================================

/**
 * Fetch a page of entities of a given kind for the admin directory.
 *
 * Uses the service-role client because RLS on these tables is inconsistent
 * — locations has public-read, organizers has public-read of is_active=true
 * only, etc. The admin list must show inactive rows too.
 */
export async function getAdminEntities(
  kind: AdminEntityKind,
  filters: AdminEntityFilters = {}
): Promise<AdminEntityResult> {
  const {
    search,
    active = 'active',
    page = 1,
    limit = 20,
    extras = {},
  } = filters;

  const meta = ADMIN_ENTITIES[kind];
  const config = SELECT_CONFIG[kind];
  const supabase = createAdminClient();
  const offset = (page - 1) * limit;
  const timer = adminDataLogger.time(`getAdminEntities:${kind}`, {
    entityType: kind,
    metadata: { filters },
  });

  // Dynamic table name — Supabase client generics are too strict here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from(meta.tableName)
    .select(config.selectColumns, { count: 'exact' });

  if (active === 'active') query = query.eq('is_active', true);
  if (active === 'inactive') query = query.eq('is_active', false);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (config.applyExtras) {
    query = config.applyExtras(query, extras);
  }

  query = query.order('created_at', { ascending: false, nullsFirst: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    timer.error(`Failed to fetch ${kind} list`, error);
    return { entities: [], total: 0, page, limit, totalPages: 0 };
  }

  const total = count || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data || []) as any[];
  const ids: string[] = rows.map((r) => r.id);

  // Parallel event-count query — pattern borrowed from get-admin-series.ts.
  const eventCounts = await countEventsForEntities(kind, ids);

  const entities: AdminEntityCard[] = rows.map((r) => ({
    ...config.mapRow(r),
    event_count: eventCounts[r.id] || 0,
  }));

  timer.success(`${kind} list fetched`, { metadata: { total, returned: entities.length } });

  return {
    entities,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================================================
// EVENT-COUNT HELPERS
// ============================================================================

/**
 * Fire N parallel count-only queries — one per entity id — returning a
 * `{ entityId: count }` map. Each query uses `head: true` so only the count
 * travels over the wire. Matches get-admin-series.ts patterning.
 */
async function countEventsForEntities(
  kind: AdminEntityKind,
  ids: string[]
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const source = ADMIN_ENTITIES[kind].eventCountSource;
  const supabase = createAdminClient();

  const promises = ids.map(async (id) => {
    if (source.kind === 'direct') {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq(source.column, id)
        .is('deleted_at', null);
      return [id, count || 0] as const;
    }
    // join-table count (event_performers, event_membership_benefits).
    // Dynamic table name — cast the client for this dispatch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from(source.joinTable)
      .select('*', { count: 'exact', head: true })
      .eq(source.joinColumn, id);
    return [id, count || 0] as const;
  });

  const results = await Promise.all(promises);
  return Object.fromEntries(results);
}
