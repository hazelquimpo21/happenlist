# Phase 3 — Event Peek Modal

**Status:** In progress (2026-04-14)
**Driver:** Human-centered, mobile-first browse flow. Cards should *peek* before they commit Jamie to a full page context switch.

---

## The human story

Jamie is scrolling Happenlist Thursday night. She taps a card. Right now, that navigates to a full page — she loses scroll position, commits to a context switch, and if it's not her vibe she has to hit back and reorient. That friction is the opposite of "browse-first, low effort, high openness."

A **peek modal** respects browse mode. She can glance, decide, and either dismiss (keep scrolling, scroll position preserved) or commit (go deep via "View full details").

---

## The two-layer model

### Layer 1 — Peek (modal / bottom sheet)
80% of taps end here. Enough info to say "yes" or "not for me."

- Hero image (larger than the card)
- Title + category badge
- Date / time (prefix "Next:" for collapsed series)
- Location (tappable → open in Maps / venue page)
- Price or free badge
- Short description (full, not truncated)
- Vibe tags + good-for chips (display only in v1)
- Heart button (prominent)
- **Primary CTA:** "Get tickets" (opens `ticket_url` in new tab) — or "See full schedule →" for parent events
- **Secondary CTA:** "View full details →" (navigates to full `/event/[slug]`)
- Close affordances: X top-right, swipe-down (mobile), tap-backdrop, Esc

### Layer 2 — Full page (existing `/event/[slug]`)
Unchanged. For commitment-level info: full description, map embed, organizer profile, series schedule, past instances, related events, siblings, accessibility details.

---

## Mobile-first interaction

- **Mobile (< 768px):** Bottom sheet. Slides up. Rounded top corners. Drag handle. ~90vh tall. Swipe down to dismiss.
- **Desktop (≥ 768px):** Centered modal. Max-width ~640px. Backdrop blur.
- Same component, two layouts via Tailwind.
- Body scroll lock while open. Focus trap. Return focus to opener on close.

---

## Architecture (SHIPPED — revised from initial plan)

**Initial plan called for Next.js parallel + intercepting routes (`@modal/(.)event/[slug]`).** During verification that produced a known Next 15 bug: `TypeError: initialTree is not iterable` during cross-segment soft navigation from `/events` → `/event/[slug]`. Reliable enough in isolation, unreliable across the app.

**Final architecture is a client-side modal with manual URL sync** — same UX, smoother in practice:

| Entry | Behavior |
|---|---|
| Tap card from feed | EventCard intercepts click → `openPeek()` → sheet slides up, `history.pushState` updates URL to `/event/[slug]` without triggering SSR. Feed stays behind. |
| Direct visit / refresh | Full page SSR renders normally. No peek layer. |
| Back button | `popstate` listener closes sheet. Feed restored with scroll position. |
| cmd / ctrl / middle click | Preserved — native browser handling (new tab to full page). |
| Share URL | Friend gets the full page. |

File structure (shipped):
```
src/
  app/
    api/event/[slug]/route.ts     ← JSON endpoint wrapping getEvent()
    event/[slug]/page.tsx         ← unchanged full page
    layout.tsx                    ← renders PeekProvider + PeekHost
  contexts/
    peek-context.tsx              ← state, history pushState, focus save
  components/events/peek/
    event-peek.tsx                ← pure content
    event-peek-sheet.tsx          ← Radix Dialog chrome (+ .Skeleton, .Error)
    peek-host.tsx                 ← renders sheet from context
    peek-skeleton.tsx             ← loading placeholder (rarely shown)
  lib/
    constants/event-peek.ts       ← CTAs, layout, log scope
    utils/card-to-peek.ts         ← stub adapter for instant first paint
```

**Instant first paint** is the smoothness win: when a card is tapped, the peek opens populated from the card's own data (title, image, date, category, short description, vibe tags) — **no skeleton flash**. Only the CTAs (which need `ticket_url`) and full description fade in once the API fetch completes.

---

## Component architecture

```
src/components/events/peek/
  event-peek.tsx             ← pure content (no dialog chrome). Reusable.
  event-peek-sheet.tsx       ← Radix Dialog wrapper. Responsive bottom-sheet/modal.
  event-peek-route.tsx       ← Client wrapper for intercepted route. Controls open state + router.back() on close.
  index.ts                   ← exports

src/lib/constants/event-peek.ts    ← CTA labels, breakpoints, classnames, telemetry scope
```

All peek files stay < 200 lines. Presentation-only; no data fetching inside peek — server component fetches event and passes down.

---

## Data flow

1. `@modal/(.)event/[slug]/page.tsx` (server component)
   - Parses slug via `parseEventSlug()`
   - Calls existing `getEvent()` — same data source as full page, zero drift
   - Renders `<EventPeekRoute event={event} />`
2. `EventPeekRoute` (client)
   - Wraps `<EventPeekSheet>` with `defaultOpen=true`
   - On `onOpenChange(false)` → `router.back()`
3. `EventPeekSheet` (client)
   - Radix Dialog, responsive layout
   - Renders `<EventPeek>` inside
4. `EventPeek` (dumb component)
   - Renders the actual content from `EventWithDetails`

---

## Logging

Per the engineering standards in CLAUDE.md, structured `[scope:action]` logs at key junctions:

- `[peek:open] event=<slug> source=intercepted` — when intercepted route renders
- `[peek:close] event=<slug>` — when sheet closes
- `[peek:cta-tickets] event=<slug>` — primary CTA click
- `[peek:cta-full] event=<slug>` — secondary CTA click
- `[peek:fetch-miss] slug=<slug>` — event not found in intercepted route

---

## Deferred / out of scope for Phase 3

- Swipe between events inside the peek (Instagram-style)
- Peek data prefetching (Next `<Link>` already prefetches)
- `event_views` telemetry for `view_type: 'peek' | 'full'` split (Phase 3.1)
- Interactive chips inside peek (tap a vibe → filter feed)

---

## Decisions on open questions (from planning convo)

| Question | Decision |
|---|---|
| Primary CTA behavior | "Get tickets" → external `ticket_url` in new tab. "View full details →" goes to full page. |
| Collapsed series in peek | Next date + recurrence line (matches card treatment). |
| Parent events | Peek *does* open for parents. Primary CTA swaps to "See full schedule →" (routes to full page). |
| Interactive pills in peek | No — display only. Revisit in Phase 3.1. |

---

## Phase breakdown

### Phase 3A — peek components (this session)
1. Constants file
2. `<EventPeek>` content
3. `<EventPeekSheet>` dialog wrapper
4. `<EventPeekRoute>` client route wrapper
5. Parallel `@modal` slot + intercepting route
6. Root layout accepts modal slot
7. Verify build passes

### Phase 3B — polish (next session)
1. Haptics on mobile open (where supported)
2. Focus management audit (manual keyboard walkthrough)
3. Measure tap-to-paint time
4. `event_views` split telemetry
5. Phase report at `docs/phase-reports/phase-3-report.md`
