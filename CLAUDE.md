# Happenlist — Design System Reference (v3)

## Design Philosophy

Happenlist is a curated local events directory for Milwaukee. The design feels like a **vibrant city festival poster** — bold, multi-chromatic, human-centered. Not a database. Not a generic Tailwind template.

Core principles:
- **Category colors create identity** — each event type is visually distinct via unique color
- **Day + time over calendar date** — people plan around their schedule ("Sat · 7pm")
- **Browse-first UX** — Jamie (primary user) is in discovery mode, low effort, high openness
- **Mobile-first** — horizontal scroll cards on mobile, grids on desktop
- **Sans-serif only** — Plus Jakarta Sans everywhere, no serif fonts

## Color System

### Neutral Scale
| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | #020203 | Primary text, headlines |
| `night` | #141416 | Dark backgrounds (hero, weekend section) |
| `slate` | #27272A | Heavy text |
| `zinc` | #71717A | Secondary text, metadata |
| `silver` | #A1A1AA | Disabled, placeholder |
| `mist` | #E4E4E7 | Borders, dividers |
| `cloud` | #F4F4F5 | Subtle backgrounds |
| `ice` | #e0f0f5 | Cool tint backgrounds |
| `white` | #FAFAFA | Page background |
| `pure` | #FFFFFF | Card backgrounds |

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `blue` | #008bd2 | Primary brand, CTAs, links, selected states |
| `orange` | #d95927 | Secondary accent |

### Category Identity Colors (15 unique)
| Category | Slug | Hex |
|----------|------|-----|
| Music | `music` | #008bd2 |
| Arts & Culture | `arts` | #008e91 |
| Food & Drink | `food` | #d95927 |
| Family | `family` | #e7b746 |
| Sports | `sports` | #E85D45 |
| Community | `community` | #D94B7A |
| Nightlife | `nightlife` | #7B2D8E |
| Classes | `classes` | #009768 |
| Festivals | `festivals` | #d48700 |
| Workshops | `workshops` | #5B4FC4 |
| Markets | `markets` | #ace671 |
| Talks | `talks` | #008bd2 |
| Outdoors | `outdoors` | #6BAD5A |
| Charity | `charity` | #D94B7A |
| Holiday | `holiday` | #e7b746 |

Color map: `src/lib/constants/category-colors.ts` — use `getCategoryColor(slug)` → `{ bg, text, accent, light }`.

### Semantic Colors
- **Selection states**: `border-blue bg-blue/10 text-blue` (forms, toggles, pills)
- **Hearts**: `text-rose` when hearted, `text-zinc` when not
- **Free badges**: `bg-emerald-light text-emerald`
- **Overlays/modals**: `bg-ink/50` backdrop
- **Hover links**: `text-blue hover:text-blue-dark`

## Typography
- **Font**: Plus Jakarta Sans (via `next/font/google`), one family for everything
- **Body class**: `font-body` — resolves to Plus Jakarta Sans
- **Type scale**: `text-hero` (4.5rem), `text-display` (3rem), `text-h1`–`text-h4`, `text-body`, `text-body-sm`, `text-caption`

## Homepage Flow (User Story)
Jamie opens Happenlist on a Thursday evening. She doesn't know what she wants — she just wants to discover something cool.

1. **Hero** — full-bleed image slideshow with crossfade, time-aware greeting ("Good evening, Milwaukee"), filter pills
2. **Editor's Picks** — 3 featured event cards (desktop grid, mobile horizontal scroll)
3. **Events by Category** — top 3 categories with real event cards, alternating white/cloud backgrounds
4. **This Weekend** — dark `bg-ink` section, horizontal scroll compact cards
5. **Just Added** — numbered list rows (01, 02, 03...) with category dots
6. **CTA** — brand blue block ("Find your next experience")

## Card Design

### EventCard (`src/components/events/event-card.tsx`)
- No top border — clean edge, shadow-card only
- Category badge: opaque pill on image (top-left), category bg color
- Date: `text-blue font-semibold` — "Today · 7pm", "Sat · 7pm", "Apr 12 · 7pm"
- Shadow: `shadow-card` → `shadow-card-lifted` + `-translate-y-1` on hover
- Free badge: `bg-emerald-light text-emerald`
- Parent badge: child count label in category accent @ 15% opacity

### CompactEventCard (homepage inline)
- Narrower (w-64), 3:2 aspect image, time badge overlay, category pill below image
- Dark variant for "This Weekend" section: `bg-night border-pure/5`

## Custom Icons
`src/components/icons/category-icons.tsx` — 15 bold geometric SVGs, `currentColor`, 24x24 viewBox.
Use `getCategoryIcon(iconName)` to get the component.

## Event Shapes — Canonical Model (v4, 2026-04-22)

> **This section replaces the old "Parent Events" + "Recurring Event Collapsing" + "Lifestyle / Ongoing Events" sections.** They conflated three different concepts into one overloaded `series` table. Going forward, we think in **three kinds** of event shape. Admin-facing version of this lives at [docs/event-shapes-onepager.md](docs/event-shapes-onepager.md).

Every event in Happenlist is exactly one of **three shapes**:

| Shape | Mental model | When to use |
|---|---|---|
| **Single** | One event with a date (or date range) and optional weekly `hours`. | Concert Saturday, one-off pop-up, museum exhibit Oct–Feb, recurring happy hour (wide date range + hours), semester-long class. |
| **Recurring** | One event concept, repeated on a schedule. Instances are materialized rows that share a `series_id`. | Weekly storytime, monthly free day, identical theatre run (same show 8 nights), weekly trivia night. |
| **Collection** | Umbrella event with distinct sub-events. Parent has its own landing page; children belong to it via `parent_event_id`. | Summerfest (acts), Brewers season (games), multi-night theatre run with variable cast. |

**There is no separate "Ongoing" shape.** What we used to call Ongoing (exhibits, happy hour, always-around things) is just a Single event with a wide date range and an `events.hours` JSONB field describing weekly availability.

### Rule of thumb

1. **Does it have distinct sub-events with their own landing pages?** → **Collection** (parent/child)
2. **Does the same thing repeat on a schedule?** → **Recurring** (series-linked instances)
3. **Otherwise** → **Single.** If it's "always kinda happening" (happy hour, exhibit), that's a Single with a wide date range + weekly `hours`.

### DB mapping

| Shape | `parent_event_id` | `series_id` | `events.hours` | Collapsed in feed? | Main feed? |
|---|---|---|---|---|---|
| Single | null | null | optional (present for "ongoing" like exhibits/happy hour) | N/A | ✅ |
| Recurring | null | set | null | ✅ | ✅ |
| Collection (parent) | null | optional | optional | ❌ | ✅ |
| Collection (child) | set → parent | optional | optional | ❌ | ❌ — shown on parent page |

**`series_type` is now a display label only**, not a structural switch. `recurring` is the only canonical value; `class`/`workshop` retained as labels for admin categorization. Obsolete values (`lifestyle`, `ongoing`, `exhibit`, `camp`, `season`, `annual`, `festival`) are being retired in the cleanup migration (see `docs/phase-reports/event-shapes-cleanup-plan.md`).

### Worked examples

| Event | Shape | Why |
|---|---|---|
| Summerfest | Collection | Distinct acts, landing page, sub-programming |
| Brewers home season | Collection | Each game is distinct content (different opponent) — deserves a season landing page |
| Hamilton, 8 identical nights | Recurrence | Same show repeating; collapse to "Thu 7pm · 7 more dates" |
| Hamilton, different cast nights | Collection | Each night is distinct content |
| Weekly storytime | Recurrence | Same event, repeats |
| Monthly museum free day | Recurrence | Same event, monthly rule |
| Summer camp (one enrollment, 5 days) | Single w/ date range | One conceptual event; don't list 5 rows |
| Camp that runs annually | Single; optional `series_id` linking this year to last year (type `annual`) | Enables "previous years" navigation without modeling it as recurrence |
| Happy hour every Friday | Ongoing | Always-around; excluded from main feed |
| Museum exhibit Oct–Feb | Ongoing | Long window, not an instance-per-day |

### `series_type` values and which shape they belong to

| `series_type` | Shape | Collapsed? | Notes |
|---|---|---|---|
| `recurring` | Recurrence | ✅ | Default recurring event |
| `class` | Recurrence | ✅ | Multi-session class with drop-in instances |
| `workshop` | Recurrence | ✅ | Same as class |
| `festival` | Collection (on parent) | ❌ | Children live via `parent_event_id` |
| `season` | Collection (on parent) | ❌ | Children via `parent_event_id` — **audit: many current `season` rows are flat (no parent); migrate to parent/child** |
| `annual` | Collection (on parent) | ❌ | Marks a parent that recurs yearly; link via `series_id` to prior-year parent |
| `camp` | Legacy — avoid | N/A | Prefer Single w/ date range. Existing rows kept for now. |
| `lifestyle` | Ongoing | N/A | Excluded from main feed |
| `ongoing` | Ongoing | N/A | Excluded from main feed |
| `exhibit` | Ongoing | N/A | Excluded from main feed |

### How collapsing works (Recurrence only)

When `collapseSeries: true` on `getEvents()`, the query over-fetches 3x, then post-processes in [src/data/events/get-events.ts:182](src/data/events/get-events.ts) to dedupe by `series_id` — keeping only the next upcoming instance. The card shows:

> **Story Time at the Library**
> Sat · 10am
> *Every Saturday · 28 more dates*

- **Collapsible types**: `recurring`, `class`, `workshop`, `lifestyle`, `ongoing`, `exhibit`
- **Never collapsed**: `festival`, `season`, `annual`, `camp` — each date is distinct content
- **Recurrence label** built from `series.recurrence_rule` JSON via `buildRecurrenceLabel()`
- **EventCard fields added**: `recurrence_label`, `upcoming_count`

### Where collapsing is enabled

| Page / Section | `collapseSeries` | Reason |
|---|---|---|
| `/events` (main listing) | `true` | Primary browse feed — avoid clutter |
| `/events/[slug]` (category) | `true` | Category browse feed |
| `/search` | `true` | Search results |
| `/organizer/[slug]` | `true` | Organizer profile |
| `/venue/[slug]` | `true` | Venue profile |
| Homepage "Events by Category" | `true` | Browse sections |
| Homepage "This Weekend" | `false` | Day-specific planning context |
| Homepage "Editor's Picks" | `false` | Curated selection |
| Homepage "Just Added" | `false` | Chronological newness |
| `/events/today` | `false` | Day-specific |
| `/events/this-weekend` | `false` | Day-specific |
| `/events/archive` | `false` | Historical |
| `/events/lifestyle` | `true` | Lifestyle-only feed |

### Main-feed filtering rules

Main browse feeds apply all three filters together:

1. `WHERE parent_event_id IS NULL` — hide collection children
2. `WHERE series.series_type NOT IN ('lifestyle', 'ongoing', 'exhibit')` unless `includeLifestyle` overrides
3. `collapseSeries` post-process if enabled

`includeLifestyle` param on `EventQueryParams`:
- `undefined` / `false` — exclude Ongoing shape (default for all browse feeds)
- `true` — include everything
- `'only'` — show only Ongoing events (used by `/events/lifestyle`)

### UI treatment of recurrence label

- **EventCard** ([src/components/events/event-card.tsx](src/components/events/event-card.tsx)): Repeat icon + label + "N more dates" below date line, `text-[11px] text-zinc`
- **HomepageEventCard** (inline in `page.tsx`): Same treatment below location/time
- **CompactEventCard** (inline): Smaller variant `text-[10px]`

### Parent/child (Collection) data layer

- [src/data/events/child-events.ts](src/data/events/child-events.ts): `getChildEvents`, `getParentEventInfo`, `getChildEventCount`
- **ChildEventsSchedule** component: date-grouped program view with filter pills, today indicator, auto-scroll
- Parent detail page: shows schedule below description
- Child detail page: shows parent breadcrumb + sibling events

### Known debt (see `docs/event-shapes-onepager.md` for audit status)

1. **`parent_event_id` is overloaded as "collection parent."** If we ever materialize variable-content recurring instances (trivia with weekly themes), we'll need a separate `recurrence_parent_id` to distinguish "child of festival" from "instance of recurring event."
2. **`series.start_date`/`end_date`/`total_sessions`** — semantics unclear. `total_sessions` is unreferenced in queries; candidate for removal. `start_date`/`end_date` should be authoritative for the run's bookends; document this.
3. **`recurrence_rule` JSON has no Zod schema.** Structure inferred from `buildRecurrenceLabel()`. Type it.
4. **No `series_kind` column.** The three-kind distinction (recurrence/collection/ongoing) lives only in our heads + this doc. Adding `series.series_kind` would make it queryable and would let the admin UI branch on it.
5. **No EXDATE (skip dates) or modified-instance support.** "Every Saturday except 12/24" has no mechanism. Add when needed.
6. **Admin UI cannot create collections.** Parent/child relationships are read-only in the edit form. Blocker for non-scraper festival entry. See admin redesign plan.

## Key Conventions
- Tailwind tokens defined in `tailwind.config.ts` — neutrals, brand, category, legacy aliases
- CSS custom properties in `globals.css` for all color tokens
- `container-page` utility for consistent max-width + padding
- Legacy color aliases exist (`coral`, `charcoal`, `sand`, etc.) but prefer new tokens (`blue`, `ink`, `mist`)
- Selection/active states use `blue` (not coral)
- Heart icon uses `rose` color
- Modal/overlay backdrops use `bg-ink/50`

---

# Engineering Standards

These rules apply to **every** code change, in this repo and in `happenlist_scraper`. Future AI sessions: read this section before writing any code.

## Code quality (non-negotiable)

1. **Modular** — small focused functions, single responsibility, no files >200 lines without strong justification. Split UI into composable components, data layer into per-concern files. Pieces should be individually testable and replaceable.

2. **Centralized data** — every controlled vocabulary, enum, magic value, color, label lives in **one** constants file and is imported everywhere it's needed. Never duplicate. Existing examples to follow:
   - `src/lib/constants/category-colors.ts`
   - `src/lib/constants/series-limits.ts`
   - `src/types/good-for.ts`
   - `src/lib/constants/routes.ts`

   **Exception**: type definitions tightly bound to one domain can co-locate with that domain (e.g. `src/types/good-for.ts`). The rule is one source of truth, not one folder.

3. **AI-dev-friendly comments** — future Claude reads this code with zero conversation context. Required:
   - Header comment on every non-trivial file: purpose + key dependencies + cross-file coupling notes
   - Inline comments explain *why*, not *what*
   - Note "if you change this, also update X" wherever cross-file coupling exists
   - Document non-obvious business rules

4. **Troubleshooting logging** — especially in scrapers, backfills, AI calls, async flows. Log inputs, outputs, errors with context, retry attempts, counts. Never silently swallow errors.

   **Logging convention**: structured prefix `[<scope>:<action>]`. Examples:
   - `[scraper:atmosphere] dropped tag "casual" — not in vocab`
   - `[backfill:atmosphere] event abc-123 — success (energy=3, formality=2)`
   - `[get-events] applied filters: goodFor=[creatives,foodies] timeOfDay=evening`
   - `[event-views] inserted view event=xyz session=s_abc`
   - `[migration:cleanup-vibe-tags] dropped 47 tags across 152 events`

## Phase review ritual

Multi-session work happens in **phases**. Every phase ends with a dedicated **Review & Harden** session before shipping:

1. **Bug hunt** — re-read every changed file: type errors, NULL handling, off-by-ones, wrong defaults, broken imports, mismatched signatures, dead branches, race conditions
2. **Connection audit** — verify everything new is wired end-to-end: new table → consumed by query? new query param → exposed in UI? new constant → imported where needed? new migration → applied to remote DB?
3. **Conflict check** — duplicate utilities, two sources of truth, conflicting Tailwind classes, type drift, inconsistent naming
4. **Gotcha brainstorm** — actively ask "what did I not consider?" Categories: timezones, pagination, RLS/auth, mobile viewport, empty states, server vs client component boundaries, hydration, caching/staleness, error states, accessibility, SEO, missing-data fallbacks
5. **Fix everything found** — no parking, no TODO comments
6. **Documentation update** — CLAUDE.md, README, inline comments, type docs all current. New decisions get a short writeup.

**Deliverable**: a written phase report at `docs/phase-reports/phase-N-report.md` capturing what was found, fixed, deferred, and the gotchas surfaced. The report briefs the next phase.

## Migration naming

`YYYYMMDD_HHMM_short_description.sql`. Use timestamps from now on. (Existing numbered migrations stay as-is — don't rename.)

## Cross-repo controlled vocabularies

**Source of truth**: `happenlist_scraper/backend/lib/vocabularies.js` (CommonJS export).
**Mirror**: `happenlist/src/lib/constants/vocabularies.ts` (TypeScript) with header comment:
```ts
// MIRROR OF: happenlist_scraper/backend/lib/vocabularies.js
// If you change this, change BOTH. Sync verified manually during phase reviews.
```

This avoids monorepo coupling while keeping each repo self-contained. Drift gets caught during phase review.

---

# Smart Filters Roadmap

**Phase 1 — DONE (2026-04-11).** All sessions A1, A2, B1, B2, B3, R1 shipped. See `docs/phase-reports/phase-1-report.md` for the full review report.

**Phase 2 — DONE (2026-04-13).** All sessions B4, B5, B6, R2 shipped. A3 done separately (scraper repo). A4 deferred. See `docs/phase-reports/phase-2-report.md` for the full review report; `docs/filter-roadmap.md` is the canonical three-phase plan.

**What Phase 1 shipped**:
- A1 — scraper taxonomy lockdown (strict enums + post-validation in atmosphere/event-meta analyzers, vocabularies source-of-truth)
- A2 — cleanup migration (dropped hallucinated vibe/subculture tags, logged to `tag_cleanup_log`) + atmosphere backfill on 86 NULL events
- B1 — `getEvents()` extended with `goodFor[]`, `timeOfDay[]`, `interestPreset`; time-of-day filter uses Chicago-local SQL extraction; constants in `interest-presets.ts`, `time-of-day.ts`, `vocabularies.ts`
- B2 — Filter UI v1: `FilterBar` (sticky), `FilterDrawer` (Radix Dialog bottom-sheet/right-panel), `FilterChip`, `EmptyFilterState`, `PastInstances` on event detail
- B3 — `event_views` table + `record_event_view()` SECURITY DEFINER function, `recordEventView` server action, `<ViewTracker />` mounted on `/event/[slug]`, `/admin/views` sanity dashboard. **Will bake unused for ~4 weeks before Phase 3 trending sort consumes it.**
- R1 — review pass: bumped session ID entropy 64→128 bits, hardened ViewTracker sentinel, single source of truth for filter count badge (server + client both go through `countActiveFilters`), aligned `/admin/views` auth pattern, made FilterBar sticky, fixed a server/client boundary bug introduced mid-R1 (parsers moved to pure `types.ts`)

**What Phase 2 shipped**:
- B4 — Distance/geo filtering: Postgres `cube`+`earthdistance` extensions, `events_within_radius()` RPC with GiST index, 15 Milwaukee neighborhoods, NeighborhoodPicker with "Use my location" geolocation, DistanceBadge on EventCard, URL-driven geo filter state (`?neighborhood=bay-view&nearLat=43.007&nearLng=-87.896&radius=5`). QA found+fixed 7 bugs including stale closures, past-event leaks in RPC, NaN guards, distance-asc sort vs collapseSeries interaction.
- B5 — Cost tiers + age groups: 6 price tiers (free/under_10/10_to_25/25_to_50/over_50/donation) and 6 age groups (all_ages/families_young_kids/elementary/teens/college/twenty_one_plus). Multi-select OR filters wired end-to-end from URL params → query layer → FilterDrawer UI. Price predicates use `is_free`/`price_low`/`price_type`. Age predicates use `age_low` only (age_high empty in DB). College group also checks `good_for @> {college_crowd}`.
- B6 — Lifecycle + past events: `idx_events_browse_active` partial index, 3 redundant indexes dropped, `series_type` CHECK expanded to 10 types (added `annual`), `PastEventBanner` on event detail, year-level archive page (`/events/archive/[year]`), `includePast` param for `getEvents()`. Month archive breadcrumbs polished.
- R2 — review pass: fixed archive pages not showing past events (hardcoded future-only filter), fixed `isPriceTierSlug`/`isAgeGroupSlug` to proper type predicates, verified all migrations applied, verified geo RPC performance (~11ms), verified all filter combos.

**Deferred from Phase 2**:
- A4 — outdoor venue audit (not blocking any filter work, revisit when indoor/outdoor filtering is a priority)

**Key constraints learned from data audit (2026-04-11)** — still relevant for Phase 3:
- `vibe_tags`/`subcultures` cleaned in A1+A2; future scraper drift caught by post-validation log
- `age_high` is empty (3 of 238 events). All age-group filtering must use `age_low` only.
- `price_low`/`price_high` coverage improved by A3 backfill. Cost-tier filter shipped in B5.
- `attendance_mode` populated on 9% of events. Drop-in filter waits for A3 backfill.
- `hearts` table has 5 rows; `event_views` has only 5 rows across 4 events (as of 2026-04-13) — **far from Phase 3 target** of >1000 rows across >50 events. Check `/admin/views` before starting Phase 3.
- Locations are 99% geocoded — distance shipped in Phase 2 Session B4.
- Storage footprint is ~17 MB for 288 events. Storage is **not** a current concern. Past-event lifecycle uses partial indexes for query speed, not deletion.

---

# Tagging Expansion (Stages 1–4, 2026-04-14)

Surfaced 5 new signal dimensions the scraper started writing in migrations 00016–00019 (accessibility, sensory, leave_with, social_mode, energy_needed) plus the four admin-only sliders (social_intensity, structure, commitment, spend_level) living in `events.inferred_signals.sliders`. Shipped as four PRs against `main`, one per stage:

**Stage 1 — Vocab + types + query layer.** `commit bb379e5`. Added 6 vocabularies + label maps + type guards to `vocabularies.ts` (byte-synced with the scraper). Extended `EventCard` / `EventWithDetails` types with the new fields and a typed `InferredSignals` shape (no `any`). Extended `EventFilters` with `accessibility[] / sensory[] / leaveWith[] / socialMode / energyNeeded`. Wired URL-param parsers in `components/events/filters/types.ts`. Extended `getEvents()` to select the new columns and apply `.overlaps()` for arrays + `.eq()` for enums, with `isX()` guards dropping unknown values defensively. **Sliders intentionally not in the public filter set — admin-only in v1 pending calibration.**

**Stage 2 — Accessibility badges + Access filter.** `commit ffc0f1c`. New `accessibility-badges.tsx` component exports `AccessibilityBadges` (detail-page section above `VibeProfile`) and `AccessibilityIconRow` (compact card icon row, max 3 + overflow). Single `aria-label` on icon rows names every feature. Filter drawer gets a new "Access" section at the **TOP** (above Neighborhood) — 12 toggle chips. EmptyFilterState renders removable accessibility chips. `events/page.tsx` forwards `accessibility/sensory/leaveWith/socialMode/energyNeeded` URL params to `getEvents()`. Empty-state rule for accessibility: render NOTHING when no tags — silence is honest, "no accessibility info" wrongly implies inaccessibility.

**Stage 3 — Sensory + leave_with + social/energy.** `commit f88173d`. `vibe-profile.tsx` extended with 4 new pill components (`SensoryTagPill`, `LeaveWithPill`, `SocialModePill`, `EnergyNeededPill`) using distinct palettes (sensory = neutral stone with amber emphasis on `strobe_lights` for seizure relevance; leave_with = emerald + lucide icons; social = indigo; energy = orange). `VibeProfileSection` renders three new sub-sections after the crowd block: "How the Room Feels" (sensory), "What You'll Leave With" (leave_with with icons), "Who It's For" (`<dl>` with social_mode + energy_needed labeled rows). Card tag row replaced: instead of slicing 2 vibes, builds a 3-chip list — social_mode + top-priority sensory + first vibe, with vibe-only fallback for legacy events. New `CollapsibleFilterSection` (`<details>` + sessionStorage at `happenlist:filter-section:<id>`) wraps the new Sensory / Leave with / Social + Energy sections so the drawer doesn't grow infinite. Helper `pickTopSensoryTag()` respects `SENSORY_TAG_PRIORITY` (strobe wins).

**Stage 4 — Admin review surface for sliders + override flow.** Migration 00020 adds `events.signal_overrides JSONB` (mirrors `inferred_signals` shape) and `signal_reviews` (append-only audit table: `{event_id, dimension, reviewer, verdict, note, reviewed_at}`). New components:
- `src/components/superadmin/signals-review-panel.tsx` — renders 4 sliders (with 1-3-5 rubric labels from `SLIDER_RUBRICS`, color-coded confidence badges, monospace evidence quotes) plus accessibility/sensory/leave_with evidence trails. Per dimension: "Looks right / Flag / Override" buttons. Override opens an inline form with the right editor for the dimension shape (chip toggle for arrays, single-select for enums, 1-5 number row for sliders).
- `src/data/admin/signal-reviews-types.ts` — client-safe types (`SignalReview`, `ReviewDimension`, `SignalOverrideValue`, `latestVerdictByDimension`). Separated from the server file because the panel is `'use client'` and the server module imports `next/headers`.
- `src/data/admin/signal-reviews.ts` — server-only fetchers + `setSignalOverride()` (read-modify-write into the JSONB; writes a `verdict='override'` audit row alongside).
- API routes: `POST /api/admin/signal-reviews` (any admin, looks_right/flagged), `POST /api/superadmin/events/[id]/signal-override` (superadmin only).

Also extended `SuperadminEventEditForm` with manual editing for `accessibility_tags / sensory_tags / leave_with` (multi-chip toggles) and `social_mode / energy_needed` (native selects). Sliders intentionally NOT in the edit form — every slider change must go through `SignalsReviewPanel` so it's attributed via `signal_reviews`.

**Public-read precedence rule** — when both `inferred_signals.X` and `signal_overrides.X` are populated, the override wins. The admin panel renders both with a "Showing reviewer override" badge so it's obvious which side fired. Public surfaces (detail page, cards) currently read only the flat columns (`accessibility_tags`, `sensory_tags`, etc.) and `inferred_signals`; promoting overrides to the flat columns is a TODO if the override flow ever sees significant traffic.

**Critical operational notes:**
- **No real data to QA against on day of ship.** Migrations 00016–00021 ran against an empty signal surface (every existing event has `accessibility_tags = '{}'`, `inferred_signals = '{}'`, etc.). Visual QA requires either re-scraping events with tag-rich pages, or hand-inserting test rows.
- **Vocab sync is load-bearing.** If `vocabularies.ts` and `happenlist_scraper/backend/lib/vocabularies.js` drift, filter guards silently drop real data. Mirror EVERY change in both files.
- **Sliders are admin-only in v1.** Do not add public slider filters until human review on ~hundreds of events confirms 1/3/5 calibration. Track progress at `/admin/signals-calibration` (agreement rate per dimension, sorted lowest-first).
- **The peek modal does not yet show any new signals.** Cards open a peek (`src/components/events/peek/`); the new accessibility/sensory/leave_with surfaces only render on the full detail page. Follow-up if the gap matters.

## Calibration dashboard

`/admin/signals-calibration` reads `signal_reviews` and shows per-dimension agreement rate (looks_right ÷ total), per-reviewer activity, and the recent activity feed with deep links to events. Sorted lowest-first so dimensions needing prompt iteration bubble up. Use the "Dims < 50% agreement" stat tile as the gating metric for "ready to expose this dimension publicly".

Source: `src/data/admin/get-signals-calibration.ts` (server) + `src/app/admin/signals-calibration/page.tsx` (admin-only, not superadmin-gated since any admin can write reviews).

## Stage 4 follow-up bug-scan + fixes (2026-04-14)

After Stage 4 landed, a deep scan of all four ships surfaced these issues. All fixes shipped in the same push as the calibration page.

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | **Critical** | `setSignalOverride` did read-modify-write on `events.signal_overrides`. Two reviewers overriding different dimensions of the same event in the same second would have one write silently lost. | Migration 00021 adds `set_signal_override_path()` Postgres RPC using `jsonb_set` for atomic per-path writes. `setSignalOverride` now calls the RPC. |
| 2 | High | `getEvents()` SELECT included `inferred_signals` (JSONB blob, can be ~1KB+ per event) but the list view never used it. ~25KB+ wasted bandwidth per page. | Removed from SELECT. Detail page (`get-event.ts`) still gets it via `select('*')`. |
| 3 | Medium | `CollapsibleFilterSection` mutated `detailsRef.current.open` in the hydration effect AND set React state. The DOM mutation was redundant since `open={open}` already controlled the element, and risked a double-toggle. | Dropped the ref entirely; React state is the single source of truth for the `<details open>` attribute. |
| 4 | Medium | `pickTopSensoryTag` would silently drop a valid sensory tag if it wasn't in `SENSORY_TAG_PRIORITY` (vocab/priority drift). | Added drift fallback: if no priority match, return the first valid tag in input order. Prevents silent data loss when the priority list lags a vocab addition. |
| 5 | Medium | `SignalsReviewPanel` rendered slider `confidence` directly into `CONFIDENCE_STYLES[confidence]`. The TS type guarantees `'high'\|'medium'\|'low'` but JSONB can hold anything — malformed payload would render `bg-undefined`. | New `normalizeConfidence()` helper falls back to `'medium'` for unknown values. |
| 6 | Low | `event-card.tsx` smart-row used `ReturnType<typeof pickTopSensoryTag> & string` for the chip type — hacky. | Imported `SensoryTag` and `SocialMode` directly; chip union now reads cleanly. Removed the `as Parameters<...>` cast on `<SocialModePill mode={...}/>`. |
| 7 | Low | `SignalsReviewPanel` had `import { useEffect } from 'react'` at the BOTTOM of the file, separate from the top imports. | Consolidated into the top import. Renamed `useMemoSyncReviews` → `useSyncReviews` (it's a `useEffect`, not a `useMemo`). |

Not fixed (accepted trade-offs):
- **Hydration flash on `CollapsibleFilterSection`:** SSR renders `defaultOpen` (true), client may flip to closed after sessionStorage read. One frame, no React warning. Acceptable.
- **Override form closes immediately on save:** No "saved!" beat. Acceptable for admin tooling.
- **Generated Supabase types don't include the new tables/columns:** every consumer casts. Regenerating types via `npx supabase gen types typescript` is a follow-up — would replace ~15 `as any` / `as unknown as X` casts across `signal-reviews.ts`, `get-admin-event.ts`, `get-events.ts`, `get-signals-calibration.ts`. Not blocking.
- **Override → flat column promotion:** Overrides on `accessibility_tags` etc. live only in `signal_overrides` JSONB. Public detail page + cards still read flat columns. If overrides see meaningful traffic, add a write-through trigger or a view that COALESCEs override over flat. Not needed yet.

---

# Scraper Integration (Phases 1–4, 2026-04-21)

The Render-hosted `happenlist_scraper` backend is now a first-class admin tool inside Happenlist — not just an inbound endpoint for the Chrome extension. Full design + gotchas in `docs/phase-reports/scraper-integration-report.md`.

## Surface area

| Capability | Entry point (happenlist) | Scraper endpoint |
|---|---|---|
| Import event from URL | `/admin/import` → URL tab | `POST /analyze/url` |
| Import event(s) from pasted text | `/admin/import` → Text tab | `POST /analyze/text` |
| Rescrape existing event + per-field diff | "Re-fetch from source" button on `SuperadminEventEditForm` | `POST /recheck` |
| Plain-English recurrence → structured rule | `RecurrenceNaturalInput` in event + series editors | `POST /parse/recurrence` |
| Nightly sold-out sweep | Vercel cron: `/api/cron/recheck-sold-out` @ 08:00 UTC | `POST /check-sold-out` |

## Key files (happenlist side)

- `src/lib/scraper/types.ts` — **MIRROR** of scraper response shapes. Update both sides together.
- `src/lib/scraper/client.ts` — server-only typed client. `X-API-Secret` auth, 60s default timeout, throws `ScraperClientError`.
- `src/lib/scraper/save-event.ts` — single source of truth for turning a scraper-analyzed event into a Supabase insert. Used by BOTH `/api/scraper/events` (Chrome extension) and `/api/superadmin/import/save` (admin UI). **Do not duplicate this logic — always extend here.**
- `src/app/admin/import/page.tsx` + `import-form.tsx` — superadmin import UI.
- `src/components/superadmin/recheck-panel.tsx` — diff modal on event edit form.
- `src/components/superadmin/recurrence-natural-input.tsx` — plain-English → structured rule input.
- `src/app/api/cron/recheck-sold-out/route.ts` — nightly cron.
- `vercel.json` — cron schedule.

## Key files (scraper side)

- `backend/services/text-extraction.js` — shared extraction core (prompt + GPT call + post-process). Both `analyze-text` and `analyze-url` wrap this.
- `backend/routes/analyze-text.js` — thin HTTP wrapper.
- `backend/routes/analyze-url.js` — fetches URL via `lib/url-context.js`, then wraps the core.
- `backend/routes/recheck.js` — re-analyzes + diffs against caller snapshot.
- `backend/routes/parse-recurrence.js` — NL → `recurrence_rule` JSONB, validated via `lib/recurrence-rule.js`.
- `backend/routes/check-sold-out.js` — thin wrapper over `services/ticket-page.js → followTicketLink()`.

## Auth + secrets

| Secret | Set on | Set on | Used for |
|---|---|---|---|
| `SCRAPER_API_SECRET` | Vercel (Happenlist) | Render (Scraper) | Both directions — Render→Vercel uses Bearer, Vercel→Render uses `X-API-Secret`. Same value, rotate together. |
| `SCRAPER_API_URL` | Vercel (Happenlist) | — | Base URL of the Render service (no trailing slash), e.g. `https://happenlist-scraper.onrender.com`. |
| `CRON_SECRET` | Vercel (Happenlist, auto-generated when you add `vercel.json` crons) | — | Vercel injects on scheduled runs. Local dev: leave blank; route allows unauth'd. |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (Happenlist), Render (Scraper) | — | Server-only writes on both sides. The scraper uses it to create venues/organizers during its own Chrome-extension save path; Happenlist uses it for every admin write. |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | both | — | Same project, same URL. |
| `OPENAI_API_KEY` | Render (Scraper) | — | LLM extraction. Happenlist does NOT need this. |
| `SUPERADMIN_EMAILS` | Vercel (Happenlist) | — | Gate for `/admin/import`, recheck button, recurrence parser. |

## Credentials checklist (what to add where)

**On Vercel → Happenlist project → Settings → Environment Variables:**

- [ ] `SCRAPER_API_URL` = your Render service URL (e.g. `https://happenlist-scraper.onrender.com`). No trailing slash.
- [ ] `SCRAPER_API_SECRET` = the same secret set on Render. If not already set, generate one (`openssl rand -hex 32`) and use the same value in both places.
- [ ] `CRON_SECRET` = Vercel auto-generates this on first deploy with `vercel.json` crons; manually set for local dev if desired.
- [ ] Verify `SUPERADMIN_EMAILS` includes the operators who should access `/admin/import` and the rescrape button.

**On Render → happenlist_scraper service → Environment:**

- [ ] `API_SECRET` = the same `SCRAPER_API_SECRET` you set on Vercel. (The scraper uses the var name `API_SECRET`; Happenlist uses `SCRAPER_API_SECRET`. Values match; names differ.)
- [ ] `ALLOWED_ORIGINS` = if you use CORS for the Chrome extension, keep existing. Happenlist→Render calls are server-side so CORS doesn't matter for them.
- [ ] `OPENAI_API_KEY` should already be there.
- [ ] `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` should already be there.

**After config is set:**

- [ ] Deploy Happenlist (picks up `vercel.json` cron schedule automatically).
- [ ] Smoke test: open `/admin/import`; the green/red status dot indicates scraper reachability.
- [ ] Smoke test cron locally: `curl -X GET http://localhost:3000/api/cron/recheck-sold-out` (no CRON_SECRET → allowed in dev).

## Cross-repo coupling rules

- **Response types** (`happenlist/src/lib/scraper/types.ts`) mirror shapes produced by scraper routes. If a scraper route grows a field, update types here too.
- **Controlled vocab drift** is still caught by the existing `vocabularies.ts` mirror (see Phase 1 Smart Filters notes). The recurrence parser passes through `buildRecurrenceRule()` so its output uses the same enums.
- **One writer** for events: `src/lib/scraper/save-event.ts`. Routes are thin; dedupe/resolve/insert logic is shared.

---

# Admin UX Improvements (2026-04-22)

Seven targeted UX improvements on top of the scraper integration, aimed at reducing friction and surfacing data-quality issues. Full report: `docs/phase-reports/admin-ux-improvements-report.md`.

| # | Improvement | Primary file |
|---|---|---|
| 1 | Inline-editable import preview | `src/app/admin/import/import-form.tsx` |
| 2 | Worklists dashboard + `/admin/worklists/[slug]` pages | `src/data/admin/get-worklists.ts` + `WorklistsTile` |
| 3 | Fuzzy dedupe detective (pg_trgm) on import preview | RPC `find_duplicate_events` + `/api/superadmin/import/check-duplicates` |
| 4 | Series "regenerate dates from text" panel with preview/apply diff | `src/app/api/superadmin/series/[id]/regenerate-dates/route.ts` + `RegenerateDatesPanel` |
| 5 | Low-confidence field heuristic flags on event editor | `src/lib/admin/field-heuristics.ts` + `FieldHeuristicFlag` |
| 6 | Bulk "assign category" action on events list | `superadminBulkChangeCategory` + `AdminEventList` dropdown |
| 7 | Recurrence preview in import (scraper-description → parsed-rule side-by-side) | ImportForm `recurrenceMap` + banner |

**Design invariants across all 7:**
- Dedupe hints, confidence flags, and recurrence parsing are **advisory** — they decorate the UI but never block a save. Admin stays in control.
- Every superadmin batch mutation writes a `admin_audit_log` row (single row per batch for bulk operations — IDs in `changes.event_ids`).
- Heuristics are client-safe pure functions; swap to real scraper per-field confidence when the scraper ships it.

**Data-quality baseline surfaced by worklists**: 246 events missing image, 290 non-free missing price_low. Clean on short_description / category / venue.
