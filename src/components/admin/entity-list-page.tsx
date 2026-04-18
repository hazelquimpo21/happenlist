/**
 * ADMIN ENTITY LIST PAGE (server component)
 * =========================================
 * Parameterized list page for Directory entities. Each per-entity
 * `/admin/<kind>/page.tsx` just passes `kind` + its searchParams through.
 *
 * Renders:
 *   - Header with "New {entity}" button
 *   - Search form
 *   - Status tabs (all / active / inactive)
 *   - Per-entity extra filter pills (configurable)
 *   - EntityCardGrid
 *   - Pagination
 *
 * This is a server component — it fetches data directly via
 * getAdminEntities. The grid itself is also server-rendered (no bulk-select
 * in v1).
 *
 * If you change the search-param shape here, also update
 * `parseEntityListParams()` below.
 */

import Link from 'next/link';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { AdminHeader, AdminBreadcrumbs } from '@/components/admin';
import { EntityCardGrid } from '@/components/admin/entity-card-grid';
import { Button } from '@/components/ui/button';
import { getAdminEntities } from '@/data/admin/get-admin-entities';
import { ADMIN_ENTITIES, type AdminEntityKind } from '@/lib/constants/admin-entities';

// ============================================================================
// SEARCH-PARAM SHAPE
// ============================================================================

export interface EntityListParams {
  page: number;
  search?: string;
  active: 'active' | 'inactive' | 'all';
  /** Entity-specific filter values (verified, venueType, genre, …). */
  extras: Record<string, string | undefined>;
}

/**
 * Parse Next.js `searchParams` into a strongly-typed shape.
 * Anything not in `knownExtraKeys` is dropped so URL params can't leak.
 */
export function parseEntityListParams(
  sp: Record<string, string | string[] | undefined>,
  knownExtraKeys: string[] = []
): EntityListParams {
  const page = typeof sp.page === 'string' ? Math.max(1, parseInt(sp.page) || 1) : 1;
  const search = typeof sp.q === 'string' && sp.q.length > 0 ? sp.q : undefined;
  const activeRaw = typeof sp.active === 'string' ? sp.active : 'active';
  const active: EntityListParams['active'] =
    activeRaw === 'inactive' || activeRaw === 'all' ? activeRaw : 'active';

  const extras: Record<string, string | undefined> = {};
  for (const key of knownExtraKeys) {
    const v = sp[key];
    if (typeof v === 'string' && v.length > 0) extras[key] = v;
  }

  return { page, search, active, extras };
}

// ============================================================================
// STATUS TABS (shared across all entity lists)
// ============================================================================

const STATUS_TABS: { value: EntityListParams['active']; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
];

// ============================================================================
// PAGE
// ============================================================================

export interface ExtraFilterSpec {
  /** URL param name (e.g. 'venueType', 'verified') */
  param: string;
  /** Label shown above the pills */
  label: string;
  /** Pill options. undefined value = "All" */
  options: Array<{ value: string | undefined; label: string }>;
}

interface EntityListPageProps {
  kind: AdminEntityKind;
  searchParams: Record<string, string | string[] | undefined>;
  extraFilters?: ExtraFilterSpec[];
}

export async function EntityListPage({
  kind,
  searchParams,
  extraFilters = [],
}: EntityListPageProps) {
  const meta = ADMIN_ENTITIES[kind];
  const knownExtraKeys = extraFilters.map((f) => f.param);
  const params = parseEntityListParams(searchParams, knownExtraKeys);

  const result = await getAdminEntities(kind, {
    page: params.page,
    limit: 20,
    search: params.search,
    active: params.active,
    extras: params.extras,
  });

  // URL builder preserves every filter except the ones being overridden.
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    if (params.search) next.set('q', params.search);
    if (params.active !== 'active') next.set('active', params.active);
    for (const key of knownExtraKeys) {
      if (params.extras[key]) next.set(key, params.extras[key]!);
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return `/admin/${meta.urlSlug}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="min-h-screen">
      <AdminHeader
        title={meta.labelPlural}
        description={`${result.total} ${result.total === 1 ? meta.label.toLowerCase() : meta.labelPlural.toLowerCase()} total`}
      >
        <div className="flex items-center gap-1 bg-cloud/50 p-1 rounded-lg">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={buildUrl({ active: tab.value === 'active' ? undefined : tab.value, page: undefined })}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                params.active === tab.value
                  ? 'bg-pure text-ink font-medium shadow-sm'
                  : 'text-zinc hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        <Button
          href={`/admin/${meta.urlSlug}/new`}
          className="flex items-center gap-2 bg-blue hover:bg-blue/90 text-white"
        >
          <Plus className="w-4 h-4" />
          New {meta.label}
        </Button>
      </AdminHeader>

      <div className="p-8">
        <AdminBreadcrumbs
          items={[{ label: 'Admin', href: '/admin' }, { label: meta.labelPlural }]}
        />

        {/* Search */}
        <div className="mb-6">
          <form className="relative max-w-md">
            <input
              type="text"
              name="q"
              defaultValue={params.search}
              placeholder={`Search ${meta.labelPlural.toLowerCase()}...`}
              className="w-full px-4 py-2 pl-10 border border-mist rounded-lg focus:border-coral focus:ring-1 focus:ring-blue outline-none"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc" />
            {params.active !== 'active' && (
              <input type="hidden" name="active" value={params.active} />
            )}
            {knownExtraKeys.map((key) =>
              params.extras[key] ? (
                <input key={key} type="hidden" name={key} value={params.extras[key]} />
              ) : null
            )}
          </form>
        </div>

        {/* Extra filter rows */}
        {extraFilters.map((spec) => (
          <div key={spec.param} className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs text-zinc uppercase tracking-wider font-medium mr-1">
              {spec.label}:
            </span>
            {spec.options.map((opt) => {
              const isSelected = params.extras[spec.param] === opt.value ||
                (opt.value === undefined && !params.extras[spec.param]);
              return (
                <Link
                  key={opt.value ?? '__all__'}
                  href={buildUrl({ [spec.param]: opt.value, page: undefined })}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    isSelected
                      ? 'bg-blue text-white font-medium'
                      : 'bg-cloud/50 text-zinc hover:text-ink hover:bg-cloud'
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Body */}
        {result.entities.length === 0 ? (
          <div className="bg-pure border border-mist rounded-lg p-12 text-center mt-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cloud flex items-center justify-center">
              <meta.icon className="w-8 h-8 text-zinc" />
            </div>
            <h2 className="font-body text-xl text-ink mb-2">No {meta.labelPlural} Found</h2>
            <p className="text-zinc max-w-md mx-auto">
              {params.search
                ? `No ${meta.labelPlural.toLowerCase()} match "${params.search}".`
                : `No ${meta.labelPlural.toLowerCase()} match the current filters.`}
            </p>
            <Button href={`/admin/${meta.urlSlug}`} variant="secondary" className="mt-6">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <EntityCardGrid kind={kind} entities={result.entities} />
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between bg-pure border border-mist rounded-lg p-4 mt-8">
                <p className="text-sm text-zinc">
                  Showing {(result.page - 1) * result.limit + 1} to{' '}
                  {Math.min(result.page * result.limit, result.total)} of {result.total}
                </p>
                <div className="flex items-center gap-2">
                  {result.page > 1 && (
                    <Link
                      href={buildUrl({ page: String(result.page - 1) })}
                      className="px-4 py-2 text-sm border border-mist rounded-lg hover:border-coral transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-zinc">
                    Page {result.page} of {result.totalPages}
                  </span>
                  {result.page < result.totalPages && (
                    <Link
                      href={buildUrl({ page: String(result.page + 1) })}
                      className="px-4 py-2 text-sm border border-mist rounded-lg hover:border-coral transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
