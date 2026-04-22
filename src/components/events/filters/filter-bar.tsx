/**
 * =============================================================================
 * FilterBar — persistent top filter row for /events
 * =============================================================================
 *
 * The first thing Jamie sees when she lands on /events. Organized into five
 * rows that each answer a single clear question:
 *
 *   0. (conditional) Saved-kids banner — "welcome back, you filter for kids"
 *   1. Search input + "All filters" drawer trigger (with active-count badge)
 *   2. 🏷️  Category — 15 colored chips (Music, Arts, Food…)
 *   3. 🎯 Good for — 10 occasion-shaped presets (Date night, With kids, …)
 *        — when "With kids" is active, a sub-row expands with age buckets
 *   4. 🕐 When — time-of-day chips (Morning / Afternoon / Evening / Late night)
 *   5. 💵 Budget — Free (cost filter lives in its own row, not jammed after When)
 *
 * Why this shape (2026-04-22 redesign):
 *   - One axis per row = one question per row. Users scan rather than untangle.
 *   - Category chips carry their own colors, reinforcing category identity
 *     throughout the app. This is the only spot in the filter UI that uses
 *     category color — FilterChip everywhere else uses brand blue.
 *   - The With Kids expander + SavedKidsBanner make parent-filtering feel
 *     curated without surprising anyone else — see kid-ages-storage.ts.
 *
 * Mobile: chip rows horizontally scroll (overflow-x-auto with -mx bleed).
 * Desktop: rows wrap.
 *
 * Cross-file coupling:
 *   - filter-drawer.tsx (mounted in row 1)
 *   - with-kids-expander.tsx (conditional sub-row in good-for)
 *   - saved-kids-banner.tsx (conditional row 0)
 *   - use-filter-state.ts (URL state)
 *   - src/lib/constants/category-colors.ts (getCategoryColor)
 *   - src/lib/constants/interest-presets.ts (presets + WITH_KIDS_PRESET_ID)
 *   - src/lib/constants/time-of-day.ts
 *   - src/app/events/page.tsx (renders this above the results grid)
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Search, Sparkles, Clock, Tag, Wallet } from 'lucide-react';
import { INTEREST_PRESETS, WITH_KIDS_PRESET_ID } from '@/lib/constants/interest-presets';
import { TIME_OF_DAY_VALUES, TIME_OF_DAY_LABELS, TIME_OF_DAY_RANGE_LABELS } from '@/lib/constants/time-of-day';
import { getCategoryColor } from '@/lib/constants/category-colors';
import { cn } from '@/lib/utils/cn';
import { FilterChip } from './filter-chip';
import { FilterDrawer, type FilterDrawerCategory, type FilterDrawerMembershipOrg } from './filter-drawer';
import { WithKidsExpander } from './with-kids-expander';
import { SavedKidsBanner } from './saved-kids-banner';
import { useFilterState } from './use-filter-state';
import { countActiveFilters } from './types';

interface FilterBarProps {
  categories: FilterDrawerCategory[];
  membershipOrgs: FilterDrawerMembershipOrg[];
}

/**
 * A category chip that wears its category's color when active. Kept inline
 * because FilterChip uses the canonical blue active-state — this is the one
 * place in the filter UI where category identity wins out. Inactive state
 * matches FilterChip visually so the row feels cohesive until selection.
 */
function CategoryChip({
  label,
  slug,
  active,
  onClick,
}: {
  label: string;
  slug: string;
  active: boolean;
  onClick: () => void;
}) {
  const color = getCategoryColor(slug);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-body font-medium',
        'border transition-all whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'px-3.5 py-1.5 text-body-sm',
        active
          ? 'font-semibold shadow-sm'
          : 'bg-pure border-mist text-ink hover:border-ink/40'
      )}
      style={
        active
          ? {
              backgroundColor: color.bg,
              borderColor: color.bg,
              color: color.text,
              // Also use category color for the focus ring when active
              // (ring-offset is already 1; the ring color falls back to the
              // browser default blue without this override).
              ['--tw-ring-color' as string]: color.bg,
            }
          : undefined
      }
    >
      <span>{label}</span>
    </button>
  );
}

export function FilterBar({ categories, membershipOrgs }: FilterBarProps) {
  const { state, toggleArrayValue, setSingle, toggleBool } = useFilterState();
  const [searchDraft, setSearchDraft] = useState(state.q ?? '');

  const activeCount = countActiveFilters(state);
  const withKidsActive = state.interestPreset === WITH_KIDS_PRESET_ID;

  // Search submits via Enter — committed value goes through setSingle so the
  // URL updates exactly once instead of on every keystroke
  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSingle('q', searchDraft.trim() || undefined);
  };

  return (
    <div className="sticky top-16 md:top-18 z-10 border-b border-mist bg-pure">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
        {/* ── Row 0: Saved-kids banner (conditional) ──────────────────────── */}
        <SavedKidsBanner />

        {/* ── Row 1: Search + Drawer trigger ──────────────────────────────── */}
        <div className="flex items-center gap-3">
          <form onSubmit={onSearchSubmit} className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onBlur={onSearchSubmit}
              placeholder="Search events"
              aria-label="Search events"
              className="w-full pl-9 pr-3 py-2 rounded-full text-body-sm font-body bg-cloud border border-mist text-ink placeholder:text-zinc focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue"
            />
          </form>

          <FilterDrawer
            categories={categories}
            membershipOrgs={membershipOrgs}
            activeCount={activeCount}
          />
        </div>

        {/* ── Row 2: Category (colored chips) ─────────────────────────────── */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-xs text-zinc font-medium flex-shrink-0">
            <Tag className="w-3 h-3" aria-hidden="true" />
            <span>Category:</span>
          </span>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 scrollbar-hide">
            {categories.map((cat) => {
              const isActive = state.category === cat.slug;
              return (
                <div key={cat.id} className="flex-shrink-0">
                  <CategoryChip
                    label={cat.name}
                    slug={cat.slug}
                    active={isActive}
                    onClick={() =>
                      setSingle('category', isActive ? undefined : cat.slug)
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row 3: Good for (presets) + optional With Kids expander ─────── */}
        <div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 text-xs text-zinc font-medium flex-shrink-0">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              <span>Good for:</span>
            </span>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 scrollbar-hide">
              {INTEREST_PRESETS.map((preset) => {
                const isActive = state.interestPreset === preset.id;
                return (
                  <div key={preset.id} className="flex-shrink-0">
                    <FilterChip
                      label={preset.label}
                      active={isActive}
                      title={preset.description}
                      onClick={() =>
                        setSingle('interestPreset', isActive ? undefined : preset.id)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {withKidsActive && <WithKidsExpander />}
        </div>

        {/* ── Row 4: When (time-of-day) ──────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="hidden sm:flex items-center gap-1 text-xs text-zinc font-medium flex-shrink-0">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>When:</span>
          </span>
          {TIME_OF_DAY_VALUES.map((bucket) => {
            const isActive = state.timeOfDay.includes(bucket);
            return (
              <FilterChip
                key={bucket}
                label={TIME_OF_DAY_LABELS[bucket]}
                title={TIME_OF_DAY_RANGE_LABELS[bucket]}
                active={isActive}
                size="sm"
                onClick={() => toggleArrayValue('timeOfDay', bucket)}
              />
            );
          })}
        </div>

        {/* ── Row 5: Budget ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="hidden sm:flex items-center gap-1 text-xs text-zinc font-medium flex-shrink-0">
            <Wallet className="w-3 h-3" aria-hidden="true" />
            <span>Budget:</span>
          </span>
          <FilterChip
            label="Free"
            active={state.isFree}
            size="sm"
            onClick={() => toggleBool('isFree')}
          />
          <FilterChip
            label="Under $10"
            title="Budget-friendly (includes free events)"
            active={state.priceTier.includes('under_10')}
            size="sm"
            onClick={() => toggleArrayValue('priceTier', 'under_10')}
          />
        </div>
      </div>
    </div>
  );
}
