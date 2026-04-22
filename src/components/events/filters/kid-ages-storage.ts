/**
 * =============================================================================
 * Kid-ages localStorage — "remember my kids' ages" for returning visitors
 * =============================================================================
 *
 * Parents who open /events on Thursday expecting "the kid-filtered Happenlist"
 * shouldn't have to re-check the same age chips every visit. This module is
 * the tiny persistence layer behind the "With kids" progressive disclosure:
 * it saves whichever age buckets the parent selected, reads them back on
 * return, and provides the imperative API the banner + expander need.
 *
 * Storage is opt-in — NOT silent persistence. The user must tick "Remember
 * for next visit" in the With Kids expander. We don't want to surprise
 * someone who filtered once by continuing to filter them forever.
 *
 * Shape stored:
 *   { ageGroups: string[]; includeAllAges: boolean; savedAt: number }
 *
 * `ageGroups` holds AGE_GROUPS slugs (families_young_kids, elementary, teens).
 * `includeAllAges` flips on the `all_ages` slug too, so parents can see
 * family-welcome events that aren't explicitly kid-programmed.
 * `savedAt` is a unix-ms timestamp; not currently used for expiry but kept so
 * a future "your saved ages are 6 months old — still accurate?" nudge has
 * something to reason about.
 *
 * Cross-file coupling:
 *   - with-kids-expander.tsx — writes via saveKidAges / clearSavedKidAges
 *   - saved-kids-banner.tsx — reads via loadSavedKidAges
 *   - filter-bar.tsx — mounts both of the above
 * =============================================================================
 */

'use client';

const STORAGE_KEY = 'happenlist:kid-ages';

export interface SavedKidAges {
  /** AGE_GROUPS slugs the parent opted into. Non-empty. */
  ageGroups: string[];
  /** Also include `all_ages` events in the filter (family-welcome but not kid-specific). */
  includeAllAges: boolean;
  /** Unix ms — when the selection was saved. */
  savedAt: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Read saved ages from localStorage. Returns null if nothing saved, unparseable, or malformed. */
export function loadSavedKidAges(): SavedKidAges | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as SavedKidAges).ageGroups) ||
      (parsed as SavedKidAges).ageGroups.some((s) => typeof s !== 'string') ||
      (parsed as SavedKidAges).ageGroups.length === 0
    ) {
      return null;
    }
    const obj = parsed as Partial<SavedKidAges>;
    return {
      ageGroups: (obj.ageGroups ?? []).filter((s) => typeof s === 'string'),
      includeAllAges: Boolean(obj.includeAllAges),
      savedAt: typeof obj.savedAt === 'number' ? obj.savedAt : Date.now(),
    };
  } catch {
    // localStorage access can throw in some sandboxed contexts (Safari private
    // mode, strict iframe). Treat any failure as "nothing saved".
    return null;
  }
}

/** Persist the parent's current age selection. Overwrites any prior save. */
export function saveKidAges(data: Omit<SavedKidAges, 'savedAt'>): void {
  if (!isBrowser()) return;
  if (data.ageGroups.length === 0) {
    // No ages selected = nothing worth remembering. Clear instead of saving {}.
    clearSavedKidAges();
    return;
  }
  try {
    const payload: SavedKidAges = { ...data, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore — full localStorage or sandbox. The app still works without persistence.
  }
}

/** Remove any saved ages. Used by "clear" on the banner + "turn off remembering" in the expander. */
export function clearSavedKidAges(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Noop — same reasoning as saveKidAges.
  }
}
