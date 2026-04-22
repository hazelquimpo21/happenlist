/**
 * =============================================================================
 * WithKidsExpander — progressive disclosure under the "With kids" preset
 * =============================================================================
 *
 * When the parent taps "With kids" in the Good-for row, this sub-row slides
 * in with age-bucket chips and two toggles. Non-parents never see it.
 *
 * Three age buckets map directly to existing AGE_GROUPS slugs so the query
 * layer needs no changes (get-events.ts already builds predicates per slug):
 *
 *   Young kids (0–5) → families_young_kids   (age_low IS NULL OR age_low <= 5)
 *   Kids (6–11)      → elementary            (age_low BETWEEN 6 AND 11)
 *   Teens (12–17)    → teens                 (age_low BETWEEN 12 AND 17)
 *
 * "All ages welcome too" adds the `all_ages` slug — a parent with a 4yo
 * probably also wants to see outdoor markets and festivals that aren't
 * explicitly kid-programmed but are family-fine. Opt-in because otherwise
 * the bucket filters would be meaningless.
 *
 * "Remember my kids' ages" persists the selection to localStorage via
 * kid-ages-storage.ts. Opt-in — we don't silently follow someone around.
 * When checked, the selection saves immediately AND re-saves whenever any
 * of the bucket chips / all-ages toggle change.
 *
 * Cross-file coupling:
 *   - filter-bar.tsx — conditionally renders this when state.interestPreset === 'with-kids'
 *   - kid-ages-storage.ts — save/load/clear
 *   - src/lib/constants/age-groups.ts — canonical slug list + predicate rules
 *   - src/data/events/get-events.ts — consumes state.ageGroup on the server
 * =============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import { FilterChip } from './filter-chip';
import { useFilterState } from './use-filter-state';
import { loadSavedKidAges, saveKidAges, clearSavedKidAges } from './kid-ages-storage';

/**
 * The three age buckets we expose under "With kids". Labels are parent-facing
 * prose; slugs match AGE_GROUPS so the server-side query just works.
 *
 * Kept narrower than the full AGE_GROUPS list on purpose — parents don't need
 * "college" or "21+" here. Those live in the drawer as adult-facing filters.
 */
const KID_AGE_BUCKETS: ReadonlyArray<{ slug: string; label: string; description: string }> = [
  { slug: 'families_young_kids', label: 'Young kids (0–5)', description: 'Babies, toddlers, preschool' },
  { slug: 'elementary',          label: 'Kids (6–11)',      description: 'Elementary-age activities' },
  { slug: 'teens',               label: 'Teens (12–17)',    description: 'Teen-friendly events' },
];

/** Bucket slugs we manage in this expander — used to cleanly separate from adult age filters. */
const MANAGED_SLUGS = new Set([...KID_AGE_BUCKETS.map((b) => b.slug), 'all_ages']);

export function WithKidsExpander() {
  const { state, setSingle } = useFilterState();

  // Which of our managed slugs are currently active in state.ageGroup?
  const activeKidSlugs = state.ageGroup.filter((s) => MANAGED_SLUGS.has(s));
  const activeBuckets = activeKidSlugs.filter((s) => s !== 'all_ages');
  const includesAllAges = activeKidSlugs.includes('all_ages');

  // "Remember my kids' ages" — mirrors localStorage presence. Hydrated on mount.
  // We keep this in local state rather than deriving purely from storage so
  // the checkbox UI doesn't flicker during the initial server render.
  const [isRemembering, setIsRemembering] = useState(false);
  useEffect(() => {
    setIsRemembering(loadSavedKidAges() !== null);
  }, []);

  // Stable string keys so the re-save effect doesn't fire on every render
  // (activeBuckets is a fresh array reference each render; its JOINED string
  // is not — only changes when the actual selected slugs change).
  const activeBucketsKey = activeBuckets.join('|');

  // When "remember" is on, persist whenever the parent's selection changes.
  // When off, do nothing (the parent explicitly opted out of memory).
  useEffect(() => {
    if (!isRemembering) return;
    saveKidAges({ ageGroups: activeBucketsKey ? activeBucketsKey.split('|') : [], includeAllAges: includesAllAges });
  }, [isRemembering, activeBucketsKey, includesAllAges]);

  /**
   * Toggle a managed age slug on/off while preserving any other age values
   * the user set elsewhere (e.g. `twenty_one_plus` from the drawer). We're
   * only stewards of OUR buckets — don't stomp the rest of the array.
   */
  const toggleManagedSlug = (slug: string) => {
    const managedAfter = activeKidSlugs.includes(slug)
      ? activeKidSlugs.filter((s) => s !== slug)
      : [...activeKidSlugs, slug];
    // Rebuild: keep non-managed slugs as-is, replace managed with the new set.
    const preserved = state.ageGroup.filter((s) => !MANAGED_SLUGS.has(s));
    setSingle('ageGroup', [...preserved, ...managedAfter]);
  };

  const handleRememberToggle = () => {
    const next = !isRemembering;
    setIsRemembering(next);
    if (next) {
      saveKidAges({ ageGroups: activeBuckets, includeAllAges: includesAllAges });
    } else {
      clearSavedKidAges();
    }
  };

  return (
    <div
      className="mt-2 pl-6 border-l-2 border-blue/20 py-1 flex flex-col gap-2"
      aria-label="Filter by kid ages"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc font-medium flex-shrink-0">Ages:</span>
        {KID_AGE_BUCKETS.map((bucket) => (
          <FilterChip
            key={bucket.slug}
            label={bucket.label}
            title={bucket.description}
            active={activeBuckets.includes(bucket.slug)}
            size="sm"
            onClick={() => toggleManagedSlug(bucket.slug)}
          />
        ))}
        <span aria-hidden="true" className="inline-block w-px h-4 bg-mist mx-1" />
        <FilterChip
          label="All ages welcome too"
          title="Also include events marked all-ages (festivals, markets, family-welcome spaces)"
          active={includesAllAges}
          size="sm"
          onClick={() => toggleManagedSlug('all_ages')}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-xs text-zinc cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={isRemembering}
          onChange={handleRememberToggle}
          className="w-3.5 h-3.5 rounded border-mist text-blue focus:ring-blue focus:ring-offset-0"
        />
        <span>
          Remember my kids&apos; ages on this device
        </span>
      </label>
    </div>
  );
}
