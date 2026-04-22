# B1 Redesign — Segmented Picker + Tabbed Discovery

**Created:** 2026-04-22
**Shipped:** 2026-04-22 — see `docs/phase-reports/b1-redesign-report.md`
**Direction:** B1 · Segmented Picker + Tabbed Discovery (selected from Claude Design handoff)
**Handoff:** `AI_DEV_DOCS/design_handoff_happenlist_filters_b1/README.md`
**Mandate:** Ship the B1 spec end-to-end. Rip out the old filter bar + drawer spaghetti, collapse the legacy long-tail filters behind a single "More" button, match the spec pixel-for-pixel using existing tokens.

---

## What this replaces

**Home (`src/app/page.tsx`)** — the `FilterPills` strip below the hero (lines ~252–280) and the current "Editor's Picks / This Weekend / Just Added" trio gets re-composed so row 1 is `HeroFeaturedCard` + `TabbedDiscovery` (Popular / New / This weekend) side-by-side. Everything below the hero row (category sections, final CTA) survives with minor polish.

**Events archive (`src/app/events/page.tsx`)** — the sticky `FilterBar` + Radix `FilterDrawer` get replaced with the slim segmented-picker bar. The 4 picker segments (Category / When / Good for / Budget) cover the high-frequency filters; **all other existing filters** (neighborhood/geo, price tier, age group, accessibility, sensory, leave_with, social mode, energy needed, solo-friendly, drop-in-ok, no-tickets-needed, curious-minds, membership, vibe/noise/access legacy) move behind a single **"More"** button that opens a redesigned drawer.

**Data layer** — `getEvents()` is already sufficient; no new filter params. Only net-new query work is a trending rank for the "Popular" tab.

---

## Scope decisions locked in

1. **Archive "More" button** keeps every filter currently in the drawer. We're redesigning the entry point, not removing filters. The drawer itself gets reorganized into the B1 popover aesthetic, but its contents stay.
2. **Budget segment** — spec has 4 tiles (Free / Under $10 / Under $25 / $25+). Map onto existing `priceTier[]` infrastructure (already shipped in Phase 2 B5). No schema changes. We keep the `isFree` boolean working as a legacy alias that resolves to `priceTier=['free']`.
3. **"Popular" tab fallback** — `event_views` is still sparse (was baking as of 2026-04-13). Initial rank: `hearts_count DESC, created_at DESC` with a rolling 14-day future-window filter. We wire `event_views` in when the table crosses ~50 events × ~1000 rows — track via existing `/admin/views`.
4. **Homepage category ordering** — we lock the 15-category visual order via a new `src/lib/constants/category-order.ts` constant (already canonical in `category-colors.ts`, we just add an ordered array).
5. **Page bg token** — existing `white` is already `#f5f4f0` (warm paper). No change needed. But B1's hero section needs `bg-ice`; verify that's available.
6. **Home vs archive ordering** — ship **archive first** (session 2). It's a 1:1 replacement of a known surface, validates the picker + popovers, and de-risks the home composition which pulls in new discovery panels.

---

## Phased plan

Six sessions + one review. Each session is one focused Claude run with a clear deliverable.

### Session B1-1 — Foundation: tokens, constants, shared primitives
**Goal:** land the shared pieces before any UI work, so every downstream session imports from one place.

**Deliverables:**
- `src/lib/constants/category-order.ts` — ordered array of 15 category slugs matching the design spec's visual order. Export `CATEGORY_DISPLAY_ORDER: string[]` and a `sortCategoriesByDisplayOrder()` helper.
- `src/lib/constants/budget-tiers.ts` — the 4 B1 budget tiles (`free`, `under_10`, `under_25`, `over_25`) with label + `priceTier[]` expansion. Maps onto existing Phase 2 B5 price tiers.
- `src/lib/filters/b1-segments.ts` — shared config describing the 4 segments (label, icon, accent color rule, popover component ID). Single source of truth for both the home picker and archive picker.
- Verify `tailwind.config.ts` tokens: `blue`, `ink`, `night`, `zinc`, `silver`, `mist`, `cloud`, `ice`, `white` (already `#f5f4f0`), `emerald`, `teal`. No additions expected; confirm only.
- Audit `src/components/icons/` for the picker icons (tag, clock, sparkles, wallet, magnifying-glass). Add anything missing.

**Touches:** constants + tailwind only. Zero UI files.

---

### Session B1-2 — Segmented picker + 4 popovers (headless)
**Goal:** build the picker component in isolation against a local demo page. No integration yet.

**Deliverables:**
- `src/components/events/filters/b1/segmented-picker.tsx` — container + segment + divider + CTA. Two variants: `variant="hero"` (w/ shadow) and `variant="inline"` (archive, no shadow). Uses Radix Popover for positioning.
- `src/components/events/filters/b1/segments/category-popover.tsx` — multi-select chip list, 15 categories, color-dot + count, selected state fills with category color.
- `src/components/events/filters/b1/segments/when-popover.tsx` — 2-column: quick picks (Today / Tomorrow / This weekend / Next 7 days / Next 30 days / Pick dates) + time-of-day chips + interpreted range card.
- `src/components/events/filters/b1/segments/good-for-popover.tsx` — single-row pill list for the 10 audiences. Multi-select.
- `src/components/events/filters/b1/segments/budget-popover.tsx` — 4 large square tiles (Free/Under $10/Under $25/$25+). Single-select. Selected state inverted.
- `src/app/(dev)/b1-picker/page.tsx` — throwaway dev route rendering the picker against local state, for QA. Deleted at end of session B1-5.

**Contract:** picker is a **controlled** component — takes `value: FilterState` + `onChange: (next: FilterState) => void`. URL wiring happens in the integration session.

**Touches:** only new files under `src/components/events/filters/b1/*`. Doesn't modify any existing filter file.

---

### Session B1-3 — Archive integration: swap the old FilterBar + Drawer
**Goal:** replace `FilterBar` and `FilterDrawer` usage on `/events` with the B1 picker + a redesigned "More" drawer. Rip out what's unused. This is the biggest cleanup session.

**Deliverables:**
- New `src/components/events/filters/b1/more-drawer.tsx` — the "More" panel, opens from the rightmost position in the inline picker bar. Contains everything NOT in the 4 segments: neighborhood + geo, price tier (beyond budget segment), age group, accessibility, sensory, leave_with, social mode, energy needed, solo/drop-in/tickets/curious/family/membership toggles, vibe/noise/access legacy. Grouped with `CollapsibleFilterSection`.
- Rewrite `src/app/events/page.tsx` to render the B1 inline picker bar + count-CTA ("Show N events") in place of the current FilterBar.
- **Delete** `src/components/events/filters/filter-bar.tsx` (replaced). Double-check no imports remain.
- **Delete** `src/components/events/filters/filter-drawer.tsx` (replaced by `more-drawer.tsx`).
- **Keep** the drawer-supporting primitives: `filter-chip.tsx`, `filter-section.tsx`, `collapsible-filter-section.tsx`, `empty-filter-state.tsx`, `sort-select.tsx`, `neighborhood-picker.tsx`, `with-kids-expander.tsx`, `saved-kids-banner.tsx`, `kid-ages-storage.ts`, `types.ts`, `use-filter-state.ts`.
- Update `src/components/events/filters/index.ts` barrel.
- Verify all 20+ URL params still round-trip: `q`, `category`, `from`, `to`, `free`, `goodFor[]`, `timeOfDay[]`, `interestPreset`, `vibeTag`, `noiseLevel`, `accessType`, `soloFriendly`, `curiousMinds`, `noTicketsNeeded`, `dropInOk`, `familyFriendly`, `memberBenefits`, `membershipOrg`, `priceTier[]`, `ageGroup[]`, `accessibility[]`, `sensory[]`, `leaveWith[]`, `socialMode`, `energyNeeded`, `neighborhood`, `nearLat`, `nearLng`, `radius`.
- Introduce the **Budget segment ↔ priceTier bridge**: selecting a Budget tile writes `priceTier[]`; legacy `?free=true` URLs still hydrate the Budget segment as "Free".
- Ensure the `countActiveFilters` badge logic stays a single source of truth.

**Cleanup targets during this session:**
- Collapse `isFree` + `priceTier` ambiguity — pick one canonical serialization (priceTier). `isFree` becomes a derived boolean read-only getter for any non-filter consumer.
- Remove any `FilterPills` scaffolding leftover from the homepage that still imports from the old `FilterBar`.
- Kill any dead CSS rules tied to the old filter bar in `globals.css`.

**Touches:** `src/app/events/page.tsx`, all filter files (delete 2, add 1, update barrel), `globals.css` (if stale rules exist).

---

### Session B1-4 — Tabbed Discovery panel + trending query
**Goal:** build the Popular / New / This weekend panel, wire it to data.

**Deliverables:**
- `src/data/events/get-trending-events.ts` — 3 server fns: `getPopularEvents(limit)`, `getNewEvents(limit)`, `getThisWeekendEvents(limit)`. Popular ranks by `hearts_count DESC, created_at DESC` with a 14-day future window. New ranks by `created_at DESC` with a 30-day future window (excludes already-past events). Weekend calls into existing `getEvents({ dateRange: 'this-weekend' })`.
- `src/components/home/tabbed-discovery.tsx` — the panel (360px fixed width desktop, full-width mobile). Tab bar + item list + footer "See all →" link. Tabs lazy-activate on first view. Each tab gets its own "See all" link preserving filter intent.
- Support a 3-slot layout: server fetches all 3 tab datasets in parallel in `page.tsx` → passes to panel → panel owns the active-tab client state.
- Thumbnail fallback: if event.image_url is null, render the 45° striped gradient in category color (matches design prototype).

**Touches:** `src/data/events/get-trending-events.ts` (new), `src/components/home/tabbed-discovery.tsx` (new). No existing files modified.

---

### Session B1-5 — Homepage integration + composition
**Goal:** rebuild `src/app/page.tsx` with the B1 hero + row 1 + category browse + This Weekend + Just Added.

**Deliverables:**
- New hero band: full-bleed `bg-ice`, centered content, eyebrow + H1 + subtitle + centered B1 picker (hero variant, with shadow). Live event count in the subtitle ("557 events on right now…").
- Row 1: `HeroFeaturedCard` (big variant, flex: 1, min-h 360px) + `TabbedDiscovery` (flex: 0 0 360px). Gap 20px.
- Keep Events-by-Category section (respects new category-order constant). Polish: alternating `bg-white`/`bg-cloud` backgrounds per spec.
- Keep This Weekend dark section + Just Added list + final CTA. Light polish only — confirm tokens match B1 spec.
- Delete the old `FilterPills` component entirely and its imports.
- Delete the dev route `src/app/(dev)/b1-picker/page.tsx`.
- Mobile composition: hero band stays, row 1 collapses to stacked (HeroCard full-width, then TabbedDiscovery full-width underneath). Picker collapses to 2×2 grid per spec; each tile opens a bottom sheet with the segment's popover content. Use the existing `FilterDrawer` bottom-sheet pattern we're keeping (Radix Dialog).

**Touches:** `src/app/page.tsx` (major rewrite), delete legacy `FilterPills`, delete dev route.

---

### Session B1-6 — Review & Harden (phase review)
**Goal:** per CLAUDE.md phase review ritual. Deliverable: `docs/phase-reports/b1-redesign-report.md`.

Checklist:
1. **Bug hunt** — re-read every new file. Type errors, NULL handling (empty category list, no hearts, zero weekend events), broken imports, server/client boundary violations (picker popovers must be client, page.tsx stays server), hydration mismatches on the interpreted-date-range card in the When popover.
2. **Connection audit** — every URL param round-trips; Budget segment correctly bridges to priceTier; count-CTA matches the archive count; mobile bottom sheets work; TabbedDiscovery tab switch doesn't refetch needlessly; "See all →" links carry filter intent into `/events`.
3. **Conflict check** — no two sources of truth for category order; no leftover FilterBar/FilterPills imports; no Tailwind class drift between hero and archive picker variants; `countActiveFilters` only called through one path.
4. **Gotcha brainstorm** — timezone (When/time-of-day runs in America/Chicago, verify on archive SSR), empty states (no events this weekend), RLS (event_views read — already public), popover z-index vs site header, sticky picker bar on archive interacting with mobile keyboard, hydration of date-range picker, SEO impact of replacing FilterPills (any backlinks?), caching staleness on Popular counts.
5. **Fix everything** — no TODO parking.
6. **Docs update** — CLAUDE.md "Smart Filters Roadmap" gets a "B1 Redesign" section. `docs/b1-redesign-plan.md` (this file) gets a "Shipped" note.

---

## Cleanup guarantees (what leaves the tree)

By end of Session B1-5, these files are deleted:
- `src/components/events/filters/filter-bar.tsx`
- `src/components/events/filters/filter-drawer.tsx`
- The homepage `FilterPills` block (inline in `page.tsx`, lines ~252–280 — not a separate file)
- Any stale CSS in `globals.css` tied to the above
- The throwaway dev route `src/app/(dev)/b1-picker/page.tsx`

What stays (reused verbatim or lightly touched): `types.ts`, `use-filter-state.ts`, `filter-chip.tsx`, `filter-section.tsx`, `collapsible-filter-section.tsx`, `empty-filter-state.tsx`, `sort-select.tsx`, `neighborhood-picker.tsx`, `with-kids-expander.tsx`, `saved-kids-banner.tsx`, `kid-ages-storage.ts`, `index.ts` (updated exports).

---

## Risks + mitigations

| Risk | Mitigation |
|------|-----------|
| Popover positioning fights the sticky bar on scroll | Use Radix Popover with `collisionPadding`; test at mobile + small desktop widths during B1-3. |
| Budget segment + priceTier[] drift | Single bridge function in `budget-tiers.ts` — `budgetToPriceTier()` + `priceTierToBudget()`. Round-trip unit-tested inline. |
| Popular tab looks empty (low hearts counts) | Fallback to "New" content when Popular returns <3 rows. Log `[trending:popular] insufficient hearts, showing new`. |
| Mobile bottom sheet + When popover's 2-column layout cramps | Stack the two columns on mobile inside the sheet. Bake into the popover component from day one. |
| Legacy `?free=true` URLs in the wild | `parseFiltersFromParams` still reads `free`; Budget segment hydrates from either `free=true` OR `priceTier=free`. |
| SSR/client boundary regressions | Parsers stay in `types.ts` (pure). Picker + popovers are `'use client'`. `page.tsx` stays server. Mirror the R1 discipline. |

---

## Acceptance criteria (shipped when all of these are true)

- `/events` renders the B1 inline picker bar; clicking each segment opens its popover; CTA reads "Show N events" and count matches results grid.
- All 20+ URL params round-trip through the new More drawer (no filter lost in the refactor).
- Home hero renders the B1 hero picker centered; Row 1 shows HeroFeaturedCard + TabbedDiscovery; category browse section renders in locked display order.
- TabbedDiscovery tabs switch instantly; each tab shows 4 items with 56×56 thumbnails, category label, title, meta; "See all →" deep-links into `/events` with the right filter.
- Mobile: picker collapses to 2×2 tiles; tapping opens bottom sheet per spec.
- `npm run build` passes; no console errors on home or archive; no hydration warnings.
- `docs/phase-reports/b1-redesign-report.md` documents what was found + fixed in the review pass.
- Old `FilterBar` / `FilterDrawer` / `FilterPills` fully deleted from the tree.

---

## Session kick-off notes for next-Claude

When picking up any session from this plan:
1. Re-read the handoff `README.md` first — the spec is canonical.
2. Re-read this plan's session section for the deliverables list.
3. Re-read `CLAUDE.md` "Engineering Standards" — modular, centralized data, AI-dev-friendly comments, structured `[scope:action]` logging.
4. Don't add net-new filter fields. The data layer (`getEvents()`) already supports everything the B1 picker needs.
5. Single-source-of-truth everything (segment config, category order, budget mapping). Import from one file, everywhere.
