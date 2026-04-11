/**
 * =============================================================================
 * FilterBar — persistent top filter row for /events
 * =============================================================================
 *
 * The first thing Jamie sees when she lands on /events. Three rows:
 *   1. Search input + "All filters" drawer trigger (with active-count badge)
 *   2. Interest preset chips (NEW in B1 — the headline filter feature)
 *   3. Time-of-day chips + Free toggle (NEW in B1)
 *
 * Categories live in the drawer rather than this bar — keeping the bar to
 * the new B1 surfaces avoids three rows of pills competing for attention,
 * and the "Filters" button counts category alongside everything else.
 *
 * Mobile: rows 2 and 3 horizontally scroll (overflow-x-auto, -mx tricks for
 * edge bleed). Desktop: rows wrap.
 *
 * State: uses `useFilterState()` directly — every chip toggle calls the
 * hook, which calls router.replace, which re-runs the server component.
 *
 * Cross-file coupling:
 *   - filter-drawer.tsx (mounted in row 1)
 *   - use-filter-state.ts (URL state)
 *   - src/lib/constants/interest-presets.ts (preset list)
 *   - src/lib/constants/time-of-day.ts (TIME_OF_DAY_VALUES + LABELS)
 *   - src/app/events/page.tsx (renders this above the results grid)
 * =============================================================================
 */

'use client';

import { useState } from 'react';
import { Search, Sparkles, Clock } from 'lucide-react';
import { INTEREST_PRESETS } from '@/lib/constants/interest-presets';
import { TIME_OF_DAY_VALUES, TIME_OF_DAY_LABELS, TIME_OF_DAY_RANGE_LABELS } from '@/lib/constants/time-of-day';
import { FilterChip } from './filter-chip';
import { FilterDrawer, type FilterDrawerCategory, type FilterDrawerMembershipOrg } from './filter-drawer';
import { useFilterState } from './use-filter-state';
import { countActiveFilters } from './types';

interface FilterBarProps {
  categories: FilterDrawerCategory[];
  membershipOrgs: FilterDrawerMembershipOrg[];
}

export function FilterBar({ categories, membershipOrgs }: FilterBarProps) {
  const { state, toggleArrayValue, setSingle, toggleBool } = useFilterState();
  const [searchDraft, setSearchDraft] = useState(state.q ?? '');

  const activeCount = countActiveFilters(state);

  // Search submits via Enter — committed value goes through setSingle so the
  // URL updates exactly once instead of on every keystroke
  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSingle('q', searchDraft.trim() || undefined);
  };

  return (
    <div className="border-b border-mist bg-pure">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
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

        {/* ── Row 2: Interest preset chips ────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-xs text-zinc font-medium flex-shrink-0">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>For me:</span>
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

        {/* ── Row 3: Time-of-day + Free ──────────────────────────────────── */}
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

          <span aria-hidden="true" className="hidden sm:inline-block w-px h-5 bg-mist mx-1" />

          <FilterChip
            label="Free"
            active={state.isFree}
            size="sm"
            onClick={() => toggleBool('isFree')}
          />
        </div>
      </div>
    </div>
  );
}
