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

## Parent Events
Events support one level of parent-child nesting (festivals → acts, theatrical runs → performances).

- `getChildEvents`, `getParentEventInfo`, `getChildEventCount` in data layer
- Main feeds filter `WHERE parent_event_id IS NULL` to hide children
- **ChildEventsSchedule**: date-grouped program view with filter pills, today indicator, auto-scroll
- Parent detail: shows schedule below description
- Child detail: shows parent breadcrumb + sibling events

## Recurring Event Collapsing (Series)

Events can belong to a **series** (linked via `series_id` → `series` table). Series have a `series_type` (`recurring`, `class`, `workshop`, `camp`, `festival`, `season`) and an optional `recurrence_rule` JSON with frequency, days_of_week, etc.

### How collapsing works
When `collapseSeries: true` is passed to `getEvents()`, recurring series instances are grouped so only the **next upcoming date** appears in the feed. The card shows a recurrence line:

> **Story Time at the Library**
> Sat · 10am
> *Every Saturday · 28 more dates*

- **Collapsible types**: `recurring`, `class`, `workshop`, `lifestyle`, `ongoing`, `exhibit` — repeating content, same event
- **Never collapsed**: `festival`, `season` — each date is distinct content
- **Implementation**: Post-processing in `src/data/events/get-events.ts` — over-fetches 3x, deduplicates by `series_id`, re-sorts by date
- **Recurrence label**: Built from `series.recurrence_rule` JSON via `buildRecurrenceLabel()` — e.g. "Every Tuesday", "Every other Friday", "Monthly on the 15th"
- **EventCard fields**: `recurrence_label` (human-readable string) and `upcoming_count` (remaining dates)

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

### Lifestyle / Ongoing Events (v3.1)

Three new series types for low-urgency, always-around events:

| Type | Slug | Examples |
|------|------|----------|
| Lifestyle | `lifestyle` | Yoga class, trivia night, happy hour |
| Ongoing | `ongoing` | Brunch specials, daily deals |
| Exhibit | `exhibit` | Museum/gallery exhibits |

**Feed behavior**: These are **excluded from the main event feed by default**. They appear:
- On `/events/lifestyle` ("Things to Do Anytime") dedicated page
- When explicitly requested via `includeLifestyle: true` or `includeLifestyle: 'only'` in `getEvents()`
- On event detail pages (always accessible by direct URL)

**Filter param**: `includeLifestyle` on `EventQueryParams`:
- `undefined` / `false` — exclude lifestyle events (default for all browse feeds)
- `true` — include everything
- `'only'` — show only lifestyle events

### UI treatment
- **EventCard** (`src/components/events/event-card.tsx`): Repeat icon + label + "N more dates" below the date line, `text-[11px] text-zinc`
- **HomepageEventCard** (inline in `page.tsx`): Same treatment below location/time line
- **CompactEventCard** (inline in `page.tsx`): Smaller variant `text-[10px]`

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

In progress — see `docs/filter-roadmap.md` for the complete three-phase plan, current data audit findings, and per-session task lists.

**Key constraints learned from data audit (2026-04-11)**:
- `vibe_tags` and `subcultures` taxonomies are currently hallucinated (~80–100 free-text values, not following the 18/23 controlled vocab). Phase 1 fixes the scraper + cleans existing data.
- `age_high` is empty (3 of 238 events). All age-group filtering must use `age_low` only.
- `price_low`/`price_high` populated on ~20% of events. Cost-tier filter shipped only after Phase 2 backfill.
- `attendance_mode` populated on 9% of events. Drop-in filter waits for backfill.
- `hearts` table has 5 rows; `view_count` is 0 across the board. Trending/popularity sorts wait for view tracking (Phase 1) to bake (~4 weeks).
- Locations are 99% geocoded — distance is fully viable.
- Storage footprint is ~17 MB for 288 events. Storage is **not** a current concern. Past-event lifecycle uses partial indexes for query speed, not deletion.
