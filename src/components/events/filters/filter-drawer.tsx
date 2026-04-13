/**
 * =============================================================================
 * FilterDrawer — advanced filters in a Radix Dialog
 * =============================================================================
 *
 * Holds the long-tail filters that don't earn a slot in the persistent
 * FilterBar: categories, raw audience tags, vibes, noise level, quick
 * toggles, and membership filters.
 *
 * Layout:
 *   - Mobile: full-width bottom sheet, slides up from bottom, ~85vh tall.
 *   - Desktop (md+): right-side panel, fixed width 420px, slides in from right.
 *
 * Footer is sticky: "Clear all" left, "Done" right. Done just closes the
 * dialog — every chip click already wrote to the URL via router.replace,
 * so there is nothing to "submit". The Done button exists because mobile
 * users expect it; without it the bottom sheet feels stranded.
 *
 * Why Radix Dialog and not a custom drawer?
 *   - Free focus trap, scroll lock, ESC to close, click-outside, ARIA roles
 *   - Battle-tested overlay/portal handling for mobile webview quirks
 *   - Already a project dependency (@radix-ui/react-dialog)
 *
 * Cross-file coupling:
 *   - filter-bar.tsx — renders the trigger inline
 *   - filter-section.tsx, filter-chip.tsx — building blocks
 *   - use-filter-state.ts — every chip click calls this
 *   - src/lib/constants/vocabularies.ts — VIBE_TAGS, NOISE_LEVELS
 *   - src/types/good-for.ts — GOOD_FOR_TAGS (rich metadata)
 * =============================================================================
 */

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { SlidersHorizontal, X } from 'lucide-react';
import { GOOD_FOR_TAGS } from '@/types/good-for';
import { PRICE_TIERS } from '@/lib/constants/price-tiers';
import { AGE_GROUPS } from '@/lib/constants/age-groups';
import { VIBE_TAGS, NOISE_LEVELS } from '@/lib/constants/vocabularies';
import { FilterChip } from './filter-chip';
import { FilterSection } from './filter-section';
import { NeighborhoodPicker } from './neighborhood-picker';
import { useFilterState } from './use-filter-state';
import { cn } from '@/lib/utils/cn';

// -----------------------------------------------------------------------------
// PROP TYPES
// -----------------------------------------------------------------------------

/** Minimal category shape needed by the drawer (avoids the heavy DB type). */
export interface FilterDrawerCategory {
  id: string;
  name: string;
  slug: string;
}

/** Minimal membership-org shape. */
export interface FilterDrawerMembershipOrg {
  id: string;
  name: string;
  event_count: number;
}

interface FilterDrawerProps {
  categories: FilterDrawerCategory[];
  membershipOrgs: FilterDrawerMembershipOrg[];
  /** Active filter count, used for the trigger button badge. */
  activeCount: number;
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

/**
 * Title-case a kebab-or-snake-cased vocabulary slug for display.
 * "festival-energy" → "Festival Energy"
 * "yoga-wellness"   → "Yoga Wellness"
 */
function slugToLabel(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FilterDrawer({
  categories,
  membershipOrgs,
  activeCount,
}: FilterDrawerProps) {
  const { state, toggleArrayValue, setSingle, toggleBool, clearAll } = useFilterState();

  return (
    <Dialog.Root>
      {/* ── Trigger ───────────────────────────────────────────────────────── */}
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full',
            'border font-body text-body-sm font-semibold',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-1',
            activeCount > 0
              ? 'bg-blue text-pure border-blue hover:bg-blue-dark'
              : 'bg-pure text-ink border-mist hover:border-blue hover:text-blue'
          )}
          aria-label={`Open all filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-pure text-blue text-[11px] font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      {/* ── Overlay + Content ─────────────────────────────────────────────── */}
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in data-[state=closed]:fade-out'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed z-50 bg-pure shadow-2xl flex flex-col',
            // Mobile: bottom sheet
            'inset-x-0 bottom-0 h-[85vh] rounded-t-2xl',
            // Desktop: right side panel
            'md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-[420px] md:rounded-none md:rounded-l-2xl',
            // Animations (Tailwind animate plugin used elsewhere; fall back to none if missing)
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'md:data-[state=open]:slide-in-from-right md:data-[state=closed]:slide-out-to-right'
          )}
          aria-describedby={undefined}
        >
          {/* Header (sticky) */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-mist">
            <Dialog.Title className="font-body text-h4 font-semibold text-ink">
              All filters
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="p-2 -mr-2 rounded-full text-zinc hover:bg-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5">
            {/* Neighborhood / distance */}
            <NeighborhoodPicker />

            {/* Categories */}
            <FilterSection
              label="Category"
              showClear={!!state.category}
              onClear={() => setSingle('category', undefined)}
            >
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.name}
                  active={state.category === cat.slug}
                  size="sm"
                  onClick={() =>
                    setSingle(
                      'category',
                      state.category === cat.slug ? undefined : cat.slug
                    )
                  }
                />
              ))}
            </FilterSection>

            {/* Audience (good_for) */}
            <FilterSection
              label="Good for"
              hint="Multi-select — events match if they fit any selected audience"
              showClear={state.goodFor.length > 0}
              onClear={() => setSingle('goodFor', [])}
            >
              {GOOD_FOR_TAGS.map((tag) => (
                <FilterChip
                  key={tag.slug}
                  label={tag.label}
                  title={tag.description}
                  active={state.goodFor.includes(tag.slug)}
                  size="sm"
                  onClick={() => toggleArrayValue('goodFor', tag.slug)}
                />
              ))}
            </FilterSection>

            {/* Price tier (B5) */}
            <FilterSection
              label="Price"
              hint="Multi-select — events match if they fit any selected tier"
              showClear={state.priceTier.length > 0}
              onClear={() => setSingle('priceTier', [])}
            >
              {PRICE_TIERS.map((tier) => (
                <FilterChip
                  key={tier.slug}
                  label={tier.label}
                  title={tier.description}
                  active={state.priceTier.includes(tier.slug)}
                  size="sm"
                  onClick={() => toggleArrayValue('priceTier', tier.slug)}
                />
              ))}
            </FilterSection>

            {/* Age group (B5) */}
            <FilterSection
              label="Ages"
              hint="Multi-select — events match if they fit any selected age group"
              showClear={state.ageGroup.length > 0}
              onClear={() => setSingle('ageGroup', [])}
            >
              {AGE_GROUPS.map((group) => (
                <FilterChip
                  key={group.slug}
                  label={group.label}
                  title={group.description}
                  active={state.ageGroup.includes(group.slug)}
                  size="sm"
                  onClick={() => toggleArrayValue('ageGroup', group.slug)}
                />
              ))}
            </FilterSection>

            {/* Vibes */}
            <FilterSection
              label="Vibe"
              showClear={!!state.vibeTag}
              onClear={() => setSingle('vibeTag', undefined)}
            >
              {VIBE_TAGS.map((tag) => (
                <FilterChip
                  key={tag}
                  label={slugToLabel(tag)}
                  active={state.vibeTag === tag}
                  size="sm"
                  onClick={() =>
                    setSingle('vibeTag', state.vibeTag === tag ? undefined : tag)
                  }
                />
              ))}
            </FilterSection>

            {/* Noise level */}
            <FilterSection
              label="Noise level"
              showClear={!!state.noiseLevel}
              onClear={() => setSingle('noiseLevel', undefined)}
            >
              {NOISE_LEVELS.map((level) => (
                <FilterChip
                  key={level}
                  label={slugToLabel(level)}
                  active={state.noiseLevel === level}
                  size="sm"
                  onClick={() =>
                    setSingle('noiseLevel', state.noiseLevel === level ? undefined : level)
                  }
                />
              ))}
            </FilterSection>

            {/* Quick toggles */}
            <FilterSection label="Quick filters">
              <FilterChip
                label="Solo-friendly"
                active={state.soloFriendly}
                size="sm"
                onClick={() => toggleBool('soloFriendly')}
              />
              <FilterChip
                label="Beginner-friendly"
                active={state.beginnerFriendly}
                size="sm"
                onClick={() => toggleBool('beginnerFriendly')}
              />
              <FilterChip
                label="No tickets needed"
                active={state.noTicketsNeeded}
                size="sm"
                onClick={() => toggleBool('noTicketsNeeded')}
              />
              <FilterChip
                label="Drop-in OK"
                active={state.dropInOk}
                size="sm"
                onClick={() => toggleBool('dropInOk')}
              />
              <FilterChip
                label="Family-friendly"
                active={state.familyFriendly}
                size="sm"
                onClick={() => toggleBool('familyFriendly')}
              />
            </FilterSection>

            {/* Membership */}
            {membershipOrgs.length > 0 && (
              <FilterSection
                label="Membership benefits"
                showClear={state.hasMemberBenefits || !!state.membershipOrgId}
                onClear={() => {
                  setSingle('hasMemberBenefits', false);
                  setSingle('membershipOrgId', undefined);
                }}
              >
                <FilterChip
                  label="Has member pricing"
                  active={state.hasMemberBenefits}
                  size="sm"
                  onClick={() => toggleBool('hasMemberBenefits')}
                />
                {membershipOrgs
                  .filter((o) => o.event_count > 0)
                  .slice(0, 8)
                  .map((org) => (
                    <FilterChip
                      key={org.id}
                      label={org.name}
                      active={state.membershipOrgId === org.id}
                      size="sm"
                      onClick={() =>
                        setSingle(
                          'membershipOrgId',
                          state.membershipOrgId === org.id ? undefined : org.id
                        )
                      }
                    />
                  ))}
              </FilterSection>
            )}
          </div>

          {/* Sticky footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-mist bg-pure">
            <button
              type="button"
              onClick={clearAll}
              className="text-body-sm font-medium text-zinc hover:text-ink focus-visible:outline-none focus-visible:underline"
            >
              Clear all
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-6 py-2.5 rounded-full bg-blue text-pure font-semibold text-body-sm hover:bg-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Done
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
