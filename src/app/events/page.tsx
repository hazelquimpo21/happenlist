/**
 * EVENTS INDEX PAGE
 * =================
 * Main events listing with filtering and pagination.
 */

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Breadcrumbs } from '@/components/layout';
import { EventGrid } from '@/components/events';
import { getEvents } from '@/data/events';
import { getCategories, getCategoryBySlug } from '@/data/categories';
import { getMembershipOrgs } from '@/data/membership';
import { GOOD_FOR_TAGS, getGoodForTag } from '@/types';
import { getCategoryColor } from '@/lib/constants/category-colors';

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
    goodFor?: string;
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
    page?: string;
  }>;
}

/**
 * Events listing page with filters.
 */
export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  console.log('📋 [EventsPage] Rendering events page with params:', params);

  // Parse params
  const page = parseInt(params.page || '1', 10);
  const isFree = params.free === 'true';
  const categorySlug = params.category;
  const goodFor = params.goodFor;
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
      goodFor,
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
      page,
      limit: 24,
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

  // Get good_for tag if filtered
  const goodForTag = goodFor ? getGoodForTag(goodFor) : undefined;

  // Build title
  let title = 'All Events';
  if (categoryName) title = `${categoryName} Events`;
  if (goodForTag) title = `${goodForTag.label} Events`;
  if (isFree) title = 'Free Events';
  if (params.q) title = `Search: "${params.q}"`;

  // Count active filters
  const activeFilterCount =
    (categorySlug ? 1 : 0) + (goodFor ? 1 : 0) + (isFree ? 1 : 0) +
    (vibeTag ? 1 : 0) + (noiseLevel ? 1 : 0) + (accessType ? 1 : 0) +
    (soloFriendly ? 1 : 0) + (beginnerFriendly ? 1 : 0) +
    (noTicketsNeeded ? 1 : 0) + (dropInOk ? 1 : 0) + (familyFriendly ? 1 : 0) +
    (memberBenefits ? 1 : 0) + (membershipOrg ? 1 : 0);

  /**
   * Build a filter URL that preserves other active params.
   * Pass null for a key to remove it from the URL.
   */
  function filterUrl(overrides: Record<string, string | null>): string {
    const base: Record<string, string> = {};
    if (categorySlug) base.category = categorySlug;
    if (goodFor) base.goodFor = goodFor;
    if (isFree) base.free = 'true';
    if (vibeTag) base.vibeTag = vibeTag;
    if (noiseLevel) base.noiseLevel = noiseLevel;
    if (accessType) base.accessType = accessType;
    if (soloFriendly) base.soloFriendly = 'true';
    if (beginnerFriendly) base.beginnerFriendly = 'true';
    if (noTicketsNeeded) base.noTicketsNeeded = 'true';
    if (dropInOk) base.dropInOk = 'true';
    if (familyFriendly) base.familyFriendly = 'true';
    if (memberBenefits) base.memberBenefits = 'true';
    if (membershipOrg) base.membershipOrg = membershipOrg;
    // Apply overrides
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) {
        delete base[k];
      } else {
        base[k] = v;
      }
    }
    const qs = new URLSearchParams(base).toString();
    return qs ? `/events?${qs}` : '/events';
  }

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          ...(categoryName ? [{ label: categoryName }] : []),
          ...(goodForTag ? [{ label: goodForTag.label }] : []),
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
        <p className="text-zinc text-body mt-2">
          {total} {total === 1 ? 'event' : 'events'} found
        </p>
      </div>

      {/* Category pills — colored per category identity */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={filterUrl({ category: null })}
          className={`px-4 py-2 rounded-full text-body-sm font-medium transition-all ${
            !categorySlug
              ? 'bg-ink text-pure shadow-sm'
              : 'bg-cloud/50 text-ink hover:bg-cloud border border-mist'
          }`}
        >
          All
        </Link>
        {categories.slice(0, 6).map((cat) => {
          const color = getCategoryColor(cat.slug);
          const isActive = categorySlug === cat.slug;
          return (
            <a
              key={cat.id}
              href={isActive ? filterUrl({ category: null }) : filterUrl({ category: cat.slug })}
              className="px-4 py-2 rounded-full text-body-sm font-medium transition-all border"
              style={
                isActive
                  ? {
                      backgroundColor: color.bg,
                      color: color.text,
                      borderColor: color.bg,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: color.bg,
                      borderColor: color.accent,
                    }
              }
            >
              {cat.name}
            </a>
          );
        })}
      </div>

      {/* Free toggle pill */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <a
          href={isFree ? filterUrl({ free: null }) : filterUrl({ free: 'true' })}
          className={`px-4 py-2 rounded-full text-body-sm font-semibold transition-all ${
            isFree
              ? 'bg-emerald text-white shadow-sm'
              : 'bg-emerald/10 text-emerald border border-sage/30 hover:bg-emerald/20'
          }`}
        >
          {isFree ? 'Free Only' : 'Free'}
        </a>
      </div>

      {/* Good For pills — warm colored per tag */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-2 text-body-sm text-zinc self-center font-medium">Good for:</span>
        {GOOD_FOR_TAGS.slice(0, 8).map((tag) => {
          const isActive = goodFor === tag.slug;
          return (
            <a
              key={tag.slug}
              href={isActive ? filterUrl({ goodFor: null }) : filterUrl({ goodFor: tag.slug })}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${
                isActive
                  ? `${tag.color} ring-2 ring-offset-1 ring-current shadow-sm`
                  : `border border-mist text-zinc hover:text-ink hover:border-charcoal/20`
              }`}
            >
              {tag.label}
            </a>
          );
        })}
      </div>

      {/* Vibe tag pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-2 text-body-sm text-zinc self-center font-medium">Vibe:</span>
        {(['cozy', 'chill', 'hype', 'rowdy', 'artsy', 'intimate', 'festival-energy', 'nerdy'] as const).map((tag) => {
          const isActive = vibeTag === tag;
          const label = tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <a
              key={tag}
              href={isActive ? filterUrl({ vibeTag: null }) : filterUrl({ vibeTag: tag })}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${
                isActive
                  ? 'bg-ink text-pure shadow-sm'
                  : 'border border-mist text-zinc hover:text-ink hover:border-charcoal/20'
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* Membership benefits filters */}
      {membershipOrgsList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-2 py-2 text-body-sm text-zinc font-medium">Members:</span>
          <a
            href={memberBenefits ? filterUrl({ memberBenefits: null }) : filterUrl({ memberBenefits: 'true' })}
            className={`px-3 py-1.5 rounded-full text-body-sm font-semibold transition-all ${
              memberBenefits
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
            }`}
          >
            Has Member Pricing
          </a>
          {membershipOrgsList.filter((o) => o.event_count > 0).slice(0, 6).map((org) => {
            const isActive = membershipOrg === org.id;
            return (
              <a
                key={org.id}
                href={isActive ? filterUrl({ membershipOrg: null }) : filterUrl({ membershipOrg: org.id })}
                className={`px-3 py-1.5 rounded-full text-body-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'border border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {org.name}
              </a>
            );
          })}
        </div>
      )}

      {/* Quick toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="px-2 py-2 text-body-sm text-zinc font-medium">Quick filters:</span>
        {([
          { key: 'soloFriendly', label: 'Solo-Friendly', active: soloFriendly },
          { key: 'beginnerFriendly', label: 'Beginner-Friendly', active: beginnerFriendly },
          { key: 'noTicketsNeeded', label: 'No Tickets Needed', active: noTicketsNeeded },
          { key: 'dropInOk', label: 'Drop-In OK', active: dropInOk },
          { key: 'familyFriendly', label: 'Family Friendly', active: familyFriendly },
        ] as const).map(({ key, label, active }) => (
          <a
            key={key}
            href={active ? filterUrl({ [key]: null }) : filterUrl({ [key]: 'true' })}
            className={`px-3 py-1.5 rounded-full text-body-sm font-semibold transition-all ${
              active
                ? 'bg-blue text-white shadow-sm'
                : 'bg-blue/10 text-blue border border-blue/20 hover:bg-blue/20'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Events grid */}
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

      {/* Pagination (simple for MVP) */}
      {total > 24 && (
        <div className="mt-12 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/events?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ''}${goodFor ? `&goodFor=${goodFor}` : ''}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Previous
            </a>
          )}
          <span className="px-4 py-2 text-zinc">
            Page {page} of {Math.ceil(total / 24)}
          </span>
          {page * 24 < total && (
            <a
              href={`/events?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ''}${goodFor ? `&goodFor=${goodFor}` : ''}`}
              className="px-4 py-2 rounded-md bg-cloud text-ink hover:bg-blue-light transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </Container>
  );
}
