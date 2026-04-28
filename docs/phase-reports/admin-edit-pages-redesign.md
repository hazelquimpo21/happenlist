# Admin Edit Pages Redesign — Phase Report

**Date:** 2026-04-28
**Scope:** `/admin/events/[id]/edit` and `/admin/series/[id]/edit`
**Goal:** Reduce friction on the highest-frequency admin tasks (skim → publish, fix one field, re-scrape and verify) and turn dense forms into a navigable, branded experience.

---

## What shipped (Phases A–F)

### Phase A — Foundation primitives
A reusable `form-shell` component library + centralized constants — built once, used by both edit pages and any future admin form.

**New constants** (single source of truth):
- [src/lib/constants/admin-accents.ts](../../src/lib/constants/admin-accents.ts) — 11-color accent palette mapping section identity to Tailwind class bundles. No more dynamic class concatenation.
- [src/lib/constants/admin-status-palette.ts](../../src/lib/constants/admin-status-palette.ts) — Status → color/icon/pulse/hint. Replaces the scattered `bg-amber-100 text-amber-800` strings.
- [src/lib/constants/admin-shape-palette.ts](../../src/lib/constants/admin-shape-palette.ts) — Single, Single·Ongoing, Recurring, Collection visual identity.
- [src/lib/constants/admin-form-sections.ts](../../src/lib/constants/admin-form-sections.ts) — Catalog of edit-page sections + tabs with icons, accents, descriptions, and Cmd+digit shortcuts.

**New hooks:**
- [src/lib/admin/use-form-dirty-state.ts](../../src/lib/admin/use-form-dirty-state.ts) — Diff form state vs. saved record. Returns `{ isDirty, count, bySection, countBySection, changes }` — drives TOC dots, command bar count, "What changed" sidebar.
- [src/lib/admin/use-unsaved-changes-guard.ts](../../src/lib/admin/use-unsaved-changes-guard.ts) — `beforeunload` + `popstate` guard.

**New form-shell components** (`src/components/admin/form-shell/`):
| Component | Purpose | LOC |
|---|---|---|
| `command-bar.tsx` | Sticky top action bar | 76 |
| `command-bar-status-select.tsx` | Status dropdown popover | 128 |
| `compact-toggle.tsx` | Compact ↔ Full mode + `useEditMode` hook | 110 |
| `dirty-dot.tsx` | Pulsing dirty indicator | 29 |
| `field-row.tsx` | Standardized label/input wrapper + shared `inputClass` | 58 |
| `form-section.tsx` | Accent-stripe collapsible with sessionStorage persistence | 178 |
| `hero-card.tsx` | Big top summary card with category-tinted gradient | 123 |
| `inline-edit-text.tsx` | Click-to-edit text primitive | 132 |
| `mini-calendar.tsx` | Month-grid dot calendar (recurrence preview, regen-dates diff) | 157 |
| `quick-checklist.tsx` | Publish-readiness ✓/✗ row | 93 |
| `section-toc.tsx` | Sticky left rail + Cmd+1..9 shortcuts | 144 |
| `status-pill.tsx` | Read-only status badge | 40 |
| `tab-bar.tsx` | Horizontal tab strip (used by series page) | 105 |
| `what-changed-card.tsx` | Live diff sidebar with empty state | 86 |

**Demo route:** `/admin/design` renders every primitive with mock data — useful for visual QA during development.

### Phase B — Edit Event refactor

The 1024-line monolithic `event-edit-form/index.tsx` was split into:

```
event-edit-form/
  index.tsx                 ← 470-ish lines: state, handlers, JSX layout
  helpers.ts                (existing, trimmed — STATUS_OPTIONS removed)
  initial-form-state.ts     ← derive FormState from AdminEventDetails
  save-event-changes.ts     ← extracted handleSave logic
  dirty-spec.ts             ← per-field dirty metadata
  derive-checklist.ts       ← publish-readiness ✓/✗
  section-renderers.tsx     ← sectionId → ReactNode map
  recheck-section.tsx       (existing)
  signal-tags-panel.tsx     (existing)
  use-heuristic-event.ts    (existing)
  delete-confirm-modal.tsx  (existing)
  venue-picker.tsx          (existing)
  organizer-picker.tsx      (existing)
  series-management-panel.tsx     (existing)
  series-occurrences-scope.tsx    (existing)
  sections/
    basics-section.tsx      title, image, descriptions, category
    when-section.tsx        date, time, all-day, hours
    where-section.tsx       venue picker
    who-section.tsx         organizer picker
    audience-section.tsx    good_for chips
    vibe-section.tsx        wraps SignalTagsPanel
    money-links-section.tsx pricing + external links
    series-collection-section.tsx  series mgmt + parent + children
    system-section.tsx      status select + audit notes
    danger-section.tsx      delete / restore
```

The page wrapper [src/app/admin/events/[id]/edit/page.tsx](../../src/app/admin/events/[id]/edit/page.tsx) dropped from 324 to 67 lines — auth + data fetch only. Hero, sidebar, command bar, and chrome live inside the form.

### Phase C — Edit Series tabs refactor

The 691-line `series-edit-form.tsx` (deleted) became:

```
series-edit-form/
  index.tsx                 ← orchestrator
  helpers.ts                ← types + constants
  dirty-spec.ts
  save-series-changes.ts
  tabs/
    details-tab.tsx         ← title/desc/type/status/price/links/SEO/featured/notes
    recurrence-tab.tsx      ← rule editor + RegenerateDatesPanel
    events-tab.tsx          ← wraps SeriesEventManager
    danger-tab.tsx          ← wraps SeriesDangerZone
```

Page wrapper dropped from 171 to 56 lines.

The footer "Cancel Series" button (which looked like a form-cancel) is gone — danger lives in its own tab now.

### Phase D — Visual polish

- ShapeBadge recolored to use `admin-shape-palette.ts` (was arbitrary pink/purple/teal).
- `focus:border-coral` swept to `focus:border-blue` across **9 admin form files** + **3 admin list pages**. Submit / login pages intentionally untouched.
- FieldHeuristicFlag converted from chunky pill → quiet 8px colored dot with hover tooltip. Fields no longer look error-state by default.
- Pulsing dot on `pending_review` and `changes_requested` statuses.
- Soft category gradient on the hero card — different category = different mood.

### Phase E — Inline edits + delight

- `InlineEditText` wired into the hero card title on both edit pages. Click the title to fix a typo without scrolling.
- Compact mode toggle persisted to localStorage. Compact hides everything below the hero + checklist.
- `MiniCalendar` integrated into the regenerate-dates panel — keep/add/drop dots overlaid on a month grid above the existing diff columns.

### Phase F — Review & harden

Findings + fixes in this pass:

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | Medium | Series command bar status select looked like it would commit independently, but Details tab owns Save. Operator could change status, switch tabs, lose the change. | Removed the select. Read-only `StatusPill` only — operator changes status via Details tab dropdown. |
| 2 | Low | `useFormDirtyState`'s `T extends Record<string, unknown>` constraint rejected strict typed FormStates. | Relaxed to `T extends object`. |
| 3 | Low | Unused `STATUS_OPTIONS` constant in `event-edit-form/helpers.ts` (legacy from before `STATUS_META`). | Removed; comment points to new location. |
| 4 | Low | Unused `Link2` import in `admin-form-sections.ts`. | Removed. |
| 5 | Low | Unused `cn` in `field-row.tsx`. | Removed. |
| 6 | Stale | `_design` folder name made the route private (App Router convention). | Renamed to `design`. |
| 7 | Tooling | After deleting `series-edit-form.tsx`, dev server cached the path → 500 errors. | Restarted dev + cleared `.next/cache/swc` + `.next/cache/webpack`. |

**Second-pass review** (deeper bug-hunt requested by Hazel):

| # | Severity | Issue | Fix |
|---|---|---|---|
| 8 | **High** | Dirty-diff baseline held in `useRef` — `originalRef.current = formState` after save mutated the ref but didn't trigger a re-render, so the "Save (N)" pill stayed stale until `router.refresh()` finished. Also, after refresh the page re-rendered with a fresh `event` prop but the form's `useState` initializer doesn't re-run, leaving the form's baseline stale relative to the freshly-fetched record. | Switched baseline from `useRef` → `useState`. Added a `key={event.id}:${event.updated_at}` to both edit forms in their page wrappers so a save → refresh roundtrip cleanly remounts with the new baseline. Applied to both event and series forms. |
| 9 | Medium | The "This event is deleted" top-level banner was dropped during the rewrite — only DangerSection retained the message. An operator opening a deleted event saw no signal until they scrolled to the danger zone. | Restored a slim banner above the hero, with an inline Restore link so the action is reachable from compact mode too. |
| 10 | Low | Demo route's `useEditMode` shared the production localStorage key `happenlist:admin-edit-mode`. Toggling compact in `/admin/design` would change the operator's preference on the real edit pages. | Demo now uses a local `useState<EditMode>` instead of the persisted hook. |
| 11 | Low | Stray `useRef` import after switching to `useState` baseline. | Removed. |

**Connection audit:** every constant in `admin-accents`, `admin-status-palette`, `admin-shape-palette`, `admin-form-sections` is consumed; every dirty-spec entry maps to a real form field; every form-shell component is exported through the barrel.

**File-size audit:**
| File | Before | After | Note |
|---|---|---|---|
| `event-edit-form/index.tsx` | 1024 | ~470 | Orchestrator + state. Strong-justification case (25 fields, 3 async actions, full layout). |
| `series-edit-form.tsx` | 691 | deleted | Replaced by `series-edit-form/` directory. |
| `series-edit-form/index.tsx` | — | 318 | New orchestrator. |
| `series-edit-form/tabs/details-tab.tsx` | — | 267 | Field markup; could split further but density is acceptable. |

All other new files are <200 lines per the CLAUDE.md target.

**Type check:** `npx tsc --noEmit` clean.
**Lint:** `npx next lint` on changed dirs — clean.
**Server compile:** `/admin/design`, `/admin/events/[id]/edit`, `/admin/series/[id]/edit` all compile and 307 to login (correct auth gate behavior — preview session was unauthenticated).

---

## Operator-facing improvements (mapped to original review)

| Original recommendation | Status |
|---|---|
| Sticky command bar with Save/Status/Preview | ✅ shipped |
| Hero summary card with image + category gradient + key facts | ✅ shipped |
| Quick-publish checklist row | ✅ shipped |
| Section TOC with dirty dots + Cmd+digit shortcuts | ✅ shipped |
| Group sections with accent stripes + icons | ✅ shipped |
| Inline-edit title in hero | ✅ shipped |
| Tabs for series page (Details / Recurrence / Events / Danger) | ✅ shipped |
| ShapeBadge recolor | ✅ shipped |
| Status palette (pulsing dots for needs-attention) | ✅ shipped |
| Coral focus → blue sweep | ✅ shipped |
| Field-heuristic flags as quiet dots | ✅ shipped |
| Drop "Use this power responsibly" reminder | ✅ shipped |
| Compact ↔ Full edit toggle | ✅ shipped |
| What-changed sidebar with live diff | ✅ shipped |
| Unsaved-changes nav guard | ✅ shipped |
| Mini-calendar for date-diff visualization | ✅ shipped (regenerate-dates) |
| Audit note moved out of footer | ✅ inside System section |
| Re-fetch promoted to first-class action | partial — moved out of mid-form banner spot, but still uses the existing `RecheckSection` UI rather than a side drawer. Drawer rework deferred. |
| Recurrence preview calendar (NL parse → next 12 dates) | deferred — would need a client-side recurrence materializer. Current approach shows the *applied* schedule via regenerate-dates. |
| Inline-edit date / venue / category in hero | deferred — only title is wired. |

---

## Known follow-ups

1. **Re-fetch drawer** — when the operator clicks Re-fetch, currently shows the existing `RecheckSection` mid-page. A side drawer with per-field accept/reject would be the bigger win. Deferred.
2. **Inline edit on more hero fields** — date, venue, category. Each needs a popover-style picker. Deferred.
3. **Recurrence preview calendar (pre-save)** — needs a client-side rule materializer. The current approach shows the saved schedule via regenerate-dates only.
4. **Mobile TOC** — collapses to nothing on `<lg` (sticky toc is `lg:` only). Could add a hamburger drop-down for narrow widths. Deferred.
5. **Section-renderers prop barrel** — `buildSectionRenderers` takes 19 args. A small `EventEditFormContext` (React context) could shrink it without sacrificing clarity. Deferred.
6. **`details-tab.tsx` at 267 lines** — within tolerance, but could split into a `pricing-block.tsx` and a `seo-block.tsx` if it grows.
7. **Tab-bar accent border** — uses inline `style={{ borderColor: hex }}` because Tailwind can't dynamic-render every accent's `border-{color}`. Acceptable trade-off.

---

## Files touched

**Added** (24 new files):
- `src/lib/constants/admin-accents.ts`
- `src/lib/constants/admin-status-palette.ts`
- `src/lib/constants/admin-shape-palette.ts`
- `src/lib/constants/admin-form-sections.ts`
- `src/lib/admin/use-form-dirty-state.ts`
- `src/lib/admin/use-unsaved-changes-guard.ts`
- `src/components/admin/form-shell/*` (14 files)
- `src/components/superadmin/event-edit-form/initial-form-state.ts`
- `src/components/superadmin/event-edit-form/save-event-changes.ts`
- `src/components/superadmin/event-edit-form/dirty-spec.ts`
- `src/components/superadmin/event-edit-form/derive-checklist.ts`
- `src/components/superadmin/event-edit-form/section-renderers.tsx`
- `src/components/superadmin/event-edit-form/sections/*` (11 files)
- `src/components/superadmin/series-edit-form/*` (8 files including `tabs/`)
- `src/app/admin/design/page.tsx` + `demo-status-and-mode.tsx`
- `docs/phase-reports/admin-edit-pages-redesign.md` (this file)

**Modified:**
- `src/app/admin/events/[id]/edit/page.tsx` (slim wrapper)
- `src/app/admin/series/[id]/edit/page.tsx` (slim wrapper)
- `src/components/superadmin/event-edit-form/index.tsx` (orchestrator rewrite)
- `src/components/superadmin/event-edit-form/helpers.ts` (cleanup)
- `src/components/superadmin/field-heuristic-flag.tsx` (quiet dot)
- `src/components/superadmin/regenerate-dates-panel.tsx` (mini-calendar overlay)
- `src/components/admin/shape-badge.tsx` (palette swap)
- 9 admin/superadmin files: coral focus → blue sweep
- 3 admin list pages: coral focus → blue sweep

**Deleted:**
- `src/components/superadmin/series-edit-form.tsx` (replaced by directory)
