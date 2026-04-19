/**
 * EVENTS INDEX PAGE
 * =================
 * Main events listing with filtering and pagination.
 *
 * B2: Filter UI is now driven by client components in
 * src/components/events/filters/* — this server component:
 *   1. Reads URL search params (the source of truth for filter state)
 *   2. Calls getEvents() with the new B1 params (interestPreset, multi
 *      goodFor, multi timeOfDay) plus the legacy ones
 *   3. Renders FilterBar above the results, EmptyFilterState when total=0
 *
 * The FilterBar / FilterDrawer client components write back to the URL via
 * router.replace, which re-runs this server component (force-dynamic).
 *
 * Cross-file coupling:
 *   - src/components/events/filters/* — UI consumers
 *   - src/data/events/get-events.ts — query layer
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import {
  FilterBar,
  SortSelect,
  EmptyFilterState,
  countActiveFilters,
  parseFiltersFromParams,
  type FilterDrawerCategory,
  type FilterDrawerMembershipOrg,
} from '@/components/events/filters';
import type { SortOption } from '@/types';
import { getEvents } from '@/data/events';
import { getCategories, getCategoryBySlug } from '@/data/categories';
import { getMembershipOrgs } from '@/data/membership';
import { getGoodForTag } from '@/types';
import { getInterestPreset } from '@/lib/constants/interest-presets';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse upcoming events in your area. Find concerts, festivals, classes, and more.',
};

interface EventsPageProps {
  searchParams: Promise<{
    category?: string;
    from?: string;
    to?: string;
    free?: string;
    q?: string;
    // B1 new — multi-value
    goodFor?: string | string[];
    timeOfDay?: string | string[];
    interestPreset?: string;
    // Legacy single-value filters
    vibeTag?: string;
    noiseLevel?: string;
    accessType?: string;
    soloFriendly?: string;
    beginnerFriendly?: string;
    noTicketsNeeded?: string;
    dropInOk?: string;
    familyFriendly?: string;
    memberBenefits?: string;
    membershipOrg?: string;
    // Price + age (B5)
    priceTier?: string | string[];
    ageGroup?: string | string[];
    // Tagging expansion (Stage 1+2). Only `accessibility` has a UI surface
    // in Stage 2; the others ride along so deep-linked URLs still flow into
    // getEvents in advance of Stage 3 surfacing them.
    accessibility?: string | string[];
    sensory?: string | string[];
    leaveWith?: string | string[];
    socialMode?: string;
    energyNeeded?: string;
    // Geo (B4)
    neighborhood?: string;
    nearLat?: string;
    nearLng?: string;
    radius?: string;
    sort?: string;
    page?: string;
  }>;
}

/**
 * Coerce a Next searchParams string|string[]|undefined value to an array.
 * Empty input → []. Used for the multi-value B1 fields.
 */
function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Events listing page with filters.
 */
export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  console.log('[events-page] rendering with params:', params);

  // Parse params
  const page = parseInt(params.page || '1', 10);
  const isFree = params.free === 'true';
  const categorySlug = params.category;
  const goodForArray = toArray(params.goodFor);
  const timeOfDayArray = toArray(params.timeOfDay);
  const priceTierArray = toArray(params.priceTier);
  const ageGroupArray = toArray(params.ageGroup);
  const accessibilityArray = toArray(params.accessibility);
  const sensoryArray = toArray(params.sensory);
  const leaveWithArray = toArray(params.leaveWith);
  const interestPreset = params.interestPreset;
  const vibeTag = params.vibeTag;
  const noiseLevel = params.noiseLevel;
  const accessType = params.accessType;
  const soloFriendly = params.soloFriendly === 'true';
  const beginnerFriendly = params.beginnerFriendly === 'true';
  const noTicketsNeeded = params.noTicketsNeeded === 'true';
  const dropInOk = params.dropInOk === 'true';
  const familyFriendly = params.familyFriendly === 'true';
  const memberBenefits = params.memberBenefits === 'true';
  const membershipOrg = params.membershipOrg;
  const nearLat = params.nearLat ? parseFloat(params.nearLat) : undefined;
  const nearLng = params.nearLng ? parseFloat(params.nearLng) : undefined;
  const radiusMiles = params.radius ? parseInt(params.radius, 10) : undefined;

  // Sort: validate against known options so a stale URL param doesn't crash
  // the query layer. Default is `date-asc` (soonest first).
  const VALID_SORTS: SortOption[] = ['date-asc', 'newest', 'popular', 'name-asc', 'date-desc', 'distance-asc'];
  const sortParam = params.sort;
  const orderBy: SortOption = (sortParam && (VALID_SORTS as string[]).includes(sortParam))
    ? (sortParam as SortOption)
    : 'date-asc';

  // Build date range if provided
  const dateRange =
    params.from || params.to
      ? { start: params.from || '', end: params.to }
      : undefined;

  // Fetch events, categories, and membership orgs
  const [{ events, total }, categories, { orgs: membershipOrgsList }] = await Promise.all([
    getEvents({
      search: params.q,
      categorySlug,
      dateRange,
      isFree,
      goodFor: goodForArray.length > 0 ? goodForArray : undefined,
      timeOfDay: timeOfDayArray.length > 0 ? timeOfDayArray : undefined,
      interestPreset,
      priceTier: priceTierArray.length > 0 ? priceTierArray : undefined,
      ageGroup: ageGroupArray.length > 0 ? ageGroupArray : undefined,
      accessibility: accessibilityArray.length > 0 ? accessibilityArray : undefined,
      sensory: sensoryArray.length > 0 ? sensoryArray : undefined,
      leaveWith: leaveWithArray.length > 0 ? leaveWithArray : undefined,
      socialMode: params.socialMode,
      energyNeeded: params.energyNeeded,
      vibeTag,
      noiseLevel,
      accessType,
      soloFriendly: soloFriendly || undefined,
      beginnerFriendly: beginnerFriendly || undefined,
      noTicketsNeeded: noTicketsNeeded || undefined,
      dropInOk: dropInOk || undefined,
      familyFriendly: familyFriendly || undefined,
      hasMemberBenefits: memberBenefits || undefined,
      membershipOrgId: membershipOrg || undefined,
      nearLat: nearLat != null && !isNaN(nearLat) ? nearLat : undefined,
      nearLng: nearLng != null && !isNaN(nearLng) ? nearLng : undefined,
      radiusMiles: radiusMiles != null && !isNaN(radiusMiles) ? radiusMiles : undefined,
      page,
      limit: 24,
      orderBy,
      collapseSeries: true,
    }),
    getCategories(),
    getMembershipOrgs({ limit: 20 }),
  ]);

  // Get category name if filtered
  let categoryName: string | undefined;
  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug);
    categoryName = category?.name;
  }

  // Get good_for tag if filtered (for breadcrumb display when single-tag)
  const singleGoodFor = goodForArray.length === 1 ? getGoodForTag(goodForArray[0]) : undefined;
  const presetMeta = interestPreset ? getInterestPreset(interestPreset) : null;

  // Build title
  let title = 'All Events';
  if (categoryName) title = `${categoryName} Events`;
  if (presetMeta) title = `${presetMeta.label} Events`;
  else if (singleGoodFor) title = `${singleGoodFor.label} Events`;
  if (isFree) title = 'Free Events';
  if (params.q) title = `Search: "${params.q}"`;

  // Total active filter count for the header badge (excludes search query).
  // Single source of truth: build a URLSearchParams from `params`, parse it
  // through the same `parseFiltersFromParams` the client filter UI uses, and
  // count via the same `countActiveFilters` helper. Keeps the badge that the
  // server renders byte-identical with the badge the client FilterBar renders
  // — adding a new filter only requires updating one site, not two.
  const activeFilterCount = (() => {
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) usp.append(key, v);
      } else {
        usp.set(key, value);
      }
    }
    return countActiveFilters(parseFiltersFromParams(usp));
  })();

  // Project the heavier categories/orgs results down to the props the filter
  // UI actually needs. Keeps the client bundle small (no full row payloads).
  const drawerCategories: FilterDrawerCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));
  const drawerMembershipOrgs: FilterDrawerMembershipOrg[] = membershipOrgsList.map((o) => ({
    id: o.id,
    name: o.name,
    event_count: o.event_count,
  }));

  // Lookup maps for the empty state's chip labels (so we don't ship the
  // whole row data through props just to render a name).
  const categoryNameById: Record<string, string> = {};
  for (const c of drawerCategories) categoryNameById[c.id] = c.name;
  const membershipOrgNameById: Record<string, string> = {};
  for (const o of drawerMembershipOrgs) membershipOrgNameById[o.id] = o.name;

  // Pagination URL builder — preserves all current search params
  function pageUrl(targetPage: number): string {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (key === 'page') continue;
      if (Array.isArray(value)) {
        for (const v of value) next.append(key, v);
      } else {
        next.set(key, value);
      }
    }
    next.set('page', String(targetPage));
    return `/events?${next.toString()}`;
  }

  return (
    <>
      {/* Persistent filter bar — sticky-friendly, full-width */}
      <FilterBar categories={drawerCategories} membershipOrgs={drawerMembershipOrgs} />

      <Container className="py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/events' },
            ...(categoryName ? [{ label: categoryName }] : []),
            ...(presetMeta ? [{ label: presetMeta.label }] : []),
            ...(singleGoodFor && !presetMeta ? [{ label: singleGoodFor.label }] : []),
          ]}
          className="mb-6"
        />

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-body text-h1 text-ink">{title}</h1>
            {activeFilterCount > 1 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue text-white">
                {activeFilterCount} filters
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-zinc text-body">
              {total} {total === 1 ? 'event' : 'events'} found
            </p>
            <SortSelect current={orderBy} />
          </div>
        </div>

        {/* Results: empty filter state when zero, otherwise grid */}
        {total === 0 ? (
          <EmptyFilterState
            categoryNameById={categoryNameById}
            membershipOrgNameById={membershipOrgNameById}
          />
        ) : (
          <EventGrid
            events={events}
            columns={4}
            emptyTitle="No events found"
            emptyMessage={
              params.q
                ? `No events match "${params.q}". Try a different search term.`
                : 'Check back soon for upcoming events!'
            }
          />
        )}

        {/* Pagination */}
        {total > 24 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue/10 transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-zinc">
              Page {page} of {Math.ceil(total / 24)}
            </span>
            {page * 24 < total && (
              <Link
                href={pageUrl(page + 1)}
                className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue/10 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
