# Phase Report — B1 Redesign (Segmented Picker + Tabbed Discovery)

**Shipped:** 2026-04-22
**Plan:** `docs/b1-redesign-plan.md`
**Handoff:** `AI_DEV_DOCS/design_handoff_happenlist_filters_b1/`

---

## What shipped

All six sessions of the B1 redesign plan (B1-1 through B1-6) in one sitting:

### B1-1 — Foundation
- `src/lib/constants/category-order.ts` — locked 15-category display order + `sortCategoriesByDisplayOrder()` helper
- `src/lib/constants/budget-tiers.ts` — 4 B1 budget tiles (Free / Under $10 / Under $25 / $25+) with a bridge to/from the existing 6-tier `priceTier` taxonomy (`budgetToPriceTiers()` / `priceTiersToBudget()`)
- `src/lib/filters/b1-segments.ts` — single source of truth for the 4 segment configs (id, label, placeholder, aria-label)
- `src/components/events/filters/b1/picker-icons.tsx` — 6 line-style SVG icons (Tag, Clock, Sparkles, Wallet, Search, ChevronDown)
- Verified tailwind tokens — all required colors already present (blue, ink, zinc, mist, cloud, ice, teal, emerald). No config changes.

### B1-2 — Picker shell + 4 popovers (headless)
- `segmented-picker.tsx` — container + segments + divider + CTA. Two variants (`hero` / `inline`). Outside-click and ESC close. Controlled component.
- `segments/category-popover.tsx` — 15-cat chip list, color dot + count, selected fills with category color
- `segments/when-popover.tsx` — 2-column layout: quick picks + time-of-day + info card. Native date inputs for custom ranges.
- `segments/good-for-popover.tsx` — pill row of 10 interest presets (single-select)
- `segments/budget-popover.tsx` — 4 big tiles, Free gets emerald, others invert to ink
- `segment-value.ts` — value-line formatters per segment (hasValue + accent color)
- `when-shorthands.ts` — `shorthandToRange()` / `rangeToShorthand()` / `formatRangeForCard()`
- `FilterState` extended with `dateFrom` / `dateTo` (previously read raw off URL in `/events/page.tsx`, now owned by state)
- `useFilterState` gained a `patch()` method for multi-field merges from a single popover action

### B1-3 — Archive integration
- `b1/picker-bar.tsx` — new client component mounting the inline-variant picker + search input + MoreDrawer + WithKidsExpander + SavedKidsBanner
- `b1/more-drawer.tsx` — replaces the old `filter-drawer.tsx`. Holds every long-tail filter behind a "More" button: accessibility, neighborhood, price-tier fine-grain, ages, vibe, noise, sensory, leave-with, social/energy, quick toggles, membership. Radix Dialog — right panel on desktop, bottom sheet on mobile.
- `/events/page.tsx` rewrite — mounts `PickerBar` in place of old `FilterBar`
- **Deleted**: `filter-bar.tsx`, `filter-drawer.tsx`
- Barrel `index.ts` rewritten — drops old exports, adds `PickerBar` / `MoreDrawer` / `CategoryPopoverItem` / `MoreDrawerMembershipOrg`
- Budget ↔ priceTier bridge end-to-end: picking "Free" in the picker writes `priceTier=['free']` AND `isFree=true` (back-compat for legacy URLs). Legacy `?free=true` URLs still hydrate the Budget segment as Free.

### B1-4 — Tabbed Discovery + trending queries
- `src/data/events/get-trending-events.ts` — three thin wrappers: `getPopularEvents` (14-day window, hearts-ranked, auto-fallback to newest when sparse), `getNewEvents` (30-day future window, newest-first), `getThisWeekendEvents` (shared weekend shorthand)
- `src/components/homepage/tabbed-discovery.tsx` — 360px panel, 3-tab bar, 56×56 thumbnails, category-colored label rows, "See all →" footer with tab-aware destinations
- Structured `[trending:*]` logs on every fetch for observability

### B1-5 — Homepage integration
- `src/components/homepage/home-hero.tsx` — ice-band hero with centered picker (hero variant). Picker owns LOCAL state; CTA serializes state and navigates to `/events`. Time-aware eyebrow updated client-side to avoid hydration drift.
- `src/components/homepage/hero-featured-card.tsx` — big featured event card with full-bleed image + gradient overlay + category badge + eyebrow + title + meta
- `src/app/page.tsx` rewrite:
  - Removed the old HeroSlideshow + FilterPills combo
  - New flow: HomeHero → (HeroFeaturedCard + TabbedDiscovery) → 3 category browse sections (walked in canonical display order) → This Weekend dark section → Just Added → final CTA
- **Deleted**: `hero-slideshow.tsx`, `filter-pills.tsx`
- Homepage barrel updated

### B1-6 — Review & harden (this pass)
Fixes applied during review:
- `HomeHero` mis-used `useState(() => …)` for a side effect → replaced with proper `useEffect` to avoid running a setter during render
- `TabbedDiscovery` hardcoded a bogus weekend URL (`?from=weekend`) → now builds real ISO dates via `shorthandToRange('this-weekend')`, memoized per tab
- Picker `More` badge arithmetic subtracts picker-covered filters from the total so the badge only reflects drawer-scope filters
- Budget↔priceTier bridge tested for exact-set matching (free/under_10/10_to_25/25_to_50/over_50 map cleanly; mixed combinations fall back to the drawer-set "Custom price" label)
- **Browser verification fixes**: first preview pass showed the hero-variant popover opening to the RIGHT of the picker (instead of below) because wrapper + picker + popover were all flex-row siblings. Fixed by wrapping the hero variant in `flex flex-col items-center` so the popover stacks below the pill. Also flipped the inner segment buttons from uniform `rounded-full` to position-based corners (`rounded-l-full` on the first, `rounded-r-full` on the last, square in the middle) so segments don't render as individual stadium pills inside the outer pill.

---

## Verification

- `npx tsc --noEmit` → clean
- `npx next lint` → only pre-existing warnings (unrelated `<img>` lints in admin/auth)
- `npx next build` → **compiled successfully**. Admin-route "Dynamic server usage" messages are pre-existing noise from the static analysis pass (admin pages use cookies by design).

---

## Gotchas + known gaps

| # | Item | Status |
|---|------|--------|
| 1 | **Mobile picker 2×2 collapse** — spec calls for the picker to collapse to a 2×2 grid of tiles on mobile (each tile opens a bottom-sheet popover). Current impl keeps the rounded-pill shape and flex-layout on mobile, which will overflow on narrow viewports. | **Deferred** — follow-up session. Doesn't block desktop QA. |
| 2 | **Popular tab sparseness** — `event_views` is still baking; trending rank uses `heart_count DESC` with a newest-first fallback when the primary window returns < 4 rows. Revisit when `/admin/views` crosses ~50 events × ~1000 rows. | **Acceptable** — logged fallback visible via `[trending:popular]`. |
| 3 | **Override → flat column** (pre-existing from Stage 4) — unrelated to B1 redesign, but any priceTier written via URL still bypasses the Budget segment's visible state when it doesn't match a tile exactly. The picker displays "Custom price" honestly when this happens. | **Working as designed.** |
| 4 | **Hydration flash on eyebrow** — server renders "Happening in Milwaukee", client may flip to "Tonight in Milwaukee" on mount. Single frame, no React warning. | **Acceptable.** |
| 5 | **Popover positioning** — popovers currently flow inline under the picker pill, stretched to the wrapper width (no `Radix.Popover.Portal`). For the hero variant centered in an ice band this looks good. If archive scrolls during popover-open, the popover scrolls with the picker (desired). | **Working as designed.** |
| 6 | **Search-input placement on mobile** — archive picker puts the search input BELOW the picker on narrow viewports (stacked). Acceptable but not pixel-spec'd. | **Acceptable.** |

---

## Cross-file coupling updated

- `FilterState` now has `dateFrom` / `dateTo` — server code in `/events/page.tsx` still reads raw `params.from` / `params.to` for `getEvents({ dateRange })` (unchanged), but the FilterState-driven picker writes through these fields. `countActiveFilters` counts the pair as a single filter.
- `useFilterState.patch(partial)` is the new preferred entry point for multi-field updates. `setSingle` / `toggleArrayValue` still work for single-axis changes.
- Category color lookup unchanged; new `sortCategoriesByDisplayOrder` gives every consumer a deterministic order.

## Files deleted

- `src/components/events/filters/filter-bar.tsx`
- `src/components/events/filters/filter-drawer.tsx`
- `src/components/homepage/hero-slideshow.tsx`
- `src/components/homepage/filter-pills.tsx`

## Files added

- `src/lib/constants/category-order.ts`
- `src/lib/constants/budget-tiers.ts`
- `src/lib/filters/b1-segments.ts`
- `src/components/events/filters/b1/picker-icons.tsx`
- `src/components/events/filters/b1/segmented-picker.tsx`
- `src/components/events/filters/b1/segment-value.ts`
- `src/components/events/filters/b1/when-shorthands.ts`
- `src/components/events/filters/b1/more-drawer.tsx`
- `src/components/events/filters/b1/picker-bar.tsx`
- `src/components/events/filters/b1/segments/category-popover.tsx`
- `src/components/events/filters/b1/segments/when-popover.tsx`
- `src/components/events/filters/b1/segments/good-for-popover.tsx`
- `src/components/events/filters/b1/segments/budget-popover.tsx`
- `src/data/events/get-trending-events.ts`
- `src/components/homepage/tabbed-discovery.tsx`
- `src/components/homepage/home-hero.tsx`
- `src/components/homepage/hero-featured-card.tsx`

## Files significantly modified

- `src/app/events/page.tsx` — swapped to PickerBar
- `src/app/page.tsx` — rewrote homepage composition
- `src/components/events/filters/types.ts` — added dateFrom/dateTo
- `src/components/events/filters/use-filter-state.ts` — added `patch()`
- `src/components/events/filters/index.ts` — barrel reshuffled
- `src/components/homepage/index.ts` — barrel updated
- `src/data/events/index.ts` — exports the 3 new trending fetchers

---

## Next phase ideas

1. **Mobile picker 2×2 + bottom-sheet** (B1 spec completion) — highest priority.
2. **Archive search-row consolidation** — the sticky search input could live inside the picker pill on desktop (to match archive design spec B).
3. **Popover portaling via Radix Popover** — would let the popover escape the sticky bar on scroll if design ever wants that behavior.
4. **Trending v2** once `event_views` has volume — add a blended rank (views × recency + hearts) to `getPopularEvents`.
