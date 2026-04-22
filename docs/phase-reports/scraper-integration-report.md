# Scraper Integration — Phases 1–4 Report

**Scope**: Wire the Render-hosted `happenlist_scraper` backend as a first-class admin tool inside Happenlist.
**Repos touched**: `happenlist/` + `happenlist_scraper/` (cross-repo work).
**Date**: 2026-04-21
**Status**: ✓ Complete

---

## TL;DR

Happenlist admins can now import events by URL or pasted text, rescrape any event and accept per-field diffs, describe series recurrence in plain English, and auto-detect sold-out events nightly via a cron. Scraper gained four new endpoints; happenlist gained a scraper client, admin import UI, rescrape panel, plain-language recurrence input, and a Vercel cron. The existing `/api/scraper/events` (inbound from Chrome extension) was refactored onto a shared save helper so there's one writer path with one set of resolver semantics.

---

## Architecture

```
Chrome Extension → Render scraper → POST /api/scraper/events → save-event.ts → Supabase
                                                                     ↑
Happenlist admin UI  →  /api/superadmin/import/save  ────────────────┘
                                                  ┌────────── same helper, one writer ──────┐
Vercel cron  →  /api/cron/recheck-sold-out  →  Render /check-sold-out  →  Supabase patch

Happenlist admin UI  →  /api/superadmin/import/analyze  →  Render /analyze/url or /analyze/text
Happenlist admin UI  →  /api/superadmin/events/[id]/recheck → Render /recheck
Happenlist admin UI  →  /api/superadmin/parse-recurrence → Render /parse/recurrence
```

All Vercel→Render calls are authenticated with `X-API-Secret`. All Render→Vercel calls (only the Chrome-extension path) use `Authorization: Bearer`. Same shared secret (`SCRAPER_API_SECRET`) on both sides.

---

## What shipped

### Phase 1 — URL + Text import to `pending_review`

**Scraper side**:
- Refactored `routes/analyze-text.js` into a thin wrapper around the new `services/text-extraction.js`. Extraction core (prompt building, GPT function-call, post-processing, ticket follow-up) is now reusable.
- New route `POST /analyze/url` — fetches a URL server-side via `lib/url-context.js`, composes text, and routes through the shared extractor. Response shape matches `/analyze/text` exactly (single or multi-event).

**Happenlist side**:
- `src/lib/scraper/types.ts` — mirror types for the scraper response shapes (`ScraperEvent`, `ScraperAnalyzeResponse`, `ScraperRecheckResponse`, `ScraperRecurrenceResponse`, `ScraperSoldOutResponse`). Marked as MIRROR OF the scraper files; must be updated in lockstep (same contract Phase 1 of the smart-filters roadmap uses for `vocabularies.ts`).
- `src/lib/scraper/client.ts` — server-only typed client. Exports `analyzeUrl`, `analyzeText`, `recheckEvent`, `parseRecurrence`, `checkSoldOut`, `scraperHealth`. Throws `ScraperClientError` on any non-2xx / timeout / network failure. Reads `SCRAPER_API_URL` + `SCRAPER_API_SECRET`.
- `src/lib/scraper/save-event.ts` — single source of truth for turning a scraper-analyzed event into an `events` row. Handles dedupe by `source_url`, resolve-or-create venue / organizer, category-by-slug lookup, and safe price_type fallback. Used by BOTH `/api/scraper/events` (Chrome extension) and `/api/superadmin/import/save` (admin UI). If you need to change any of that behavior, change it here — not in the route.
- `/admin/import` page + `import-form.tsx` client component — two tabs (URL / Text), preview step with per-event checkboxes, save-selected button, done screen with deep links into `/admin/events/[id]`.
- `POST /api/superadmin/import/analyze` — superadmin-only proxy to scraper.
- `POST /api/superadmin/import/save` — saves analyzed events as `pending_review` so they go through the normal review queue.
- Added "Import" nav item in `AdminSidebar`.
- Added `SCRAPER_API_URL` to `.env.example`.

**Refactor**: `/api/scraper/events` now delegates to `saveScrapedEvent()`. Request/response shape unchanged — Chrome extension doesn't notice. The inline `resolveLocation` / `resolveOrganizer` helpers moved into `save-event.ts`.

### Phase 2 — Rescrape + per-field diff

**Scraper side**:
- `POST /recheck` — takes `{ sourceUrl, currentEvent }`, re-fetches via `url-context`, routes through the extractor, and returns `{ event, diff, unchanged }`. Diff is field-level, trimmed to the 20 fields worth flagging to a human (full list in `routes/recheck.js`). `null`/`''`/`undefined` normalize to equal; numeric prices use ε=0.005 to ignore float drift.

**Happenlist side**:
- `POST /api/superadmin/events/[id]/recheck` — loads the event (superadmin only), builds a snapshot, forwards to the scraper, returns the diff. Does NOT apply changes — applying goes through the existing `PATCH /api/superadmin/events/[id]` so audit logs stay consistent.
- `RecheckPanel` component — button + modal. Shows each changed field with before/after + a checkbox. Two fields (`category_slug`, `organizer_name`) are flagged "not auto-applied" since they'd need table lookups. Apply → PATCH → `router.refresh()`.
- Mounted in `SuperadminEventEditForm` at the top, alongside a link to the source URL. Hidden on soft-deleted events.

### Phase 3 — Plain-English recurrence parser

**Scraper side**:
- `POST /parse/recurrence` — takes `{ description, startDate?, defaultTime? }`. Uses MODEL_SMART with a tight function schema covering the 10 recurrence fields, pinned to `tool_choice=extract_recurrence`. Output is run through the existing `lib/recurrence-rule.js → buildRecurrenceRule()` so the shape is guaranteed identical to scraped events and UI-renderable. Returns `{ recurrence_rule, recurrence_description }` (normalized human label like "Every other Tuesday at 7pm").

**Happenlist side**:
- `POST /api/superadmin/parse-recurrence` — thin proxy.
- `RecurrenceNaturalInput` component — small input + Parse button. Calls the proxy, shows the normalized label on success, invokes `onParsed({ rule, description })`.
- Wired into `EventEditForm` above the existing `RecurrenceBuilder` when making a standalone event recurring. Parsing it fires `handleMakeRecurring(rule)` directly — the structured form stays available below for manual edits.
- Wired into `SeriesEditForm` as a new `RecurrenceSection` below the main form. PATCHes `series.recurrence_rule` with its own Save button so the parser doesn't require the operator to also re-submit price/status/etc.

### Phase 4 — Nightly sold-out sweep

**Scraper side**:
- `POST /check-sold-out` — thin wrapper around the existing `services/ticket-page.js → followTicketLink()`. Cheap: only hits the ticket URL, no LLM pass over the full event page. Returns `{ sold_out, sold_out_details, price_low, price_high, price_details, updates }` where `updates` is a ready-to-merge patch object containing only fields the follow-up populated.

**Happenlist side**:
- `GET /api/cron/recheck-sold-out` — scans up to 30 upcoming-ticketed events per run (status=published, start_datetime in next 30 days, ticket_url present, sold_out not already true). Sequential calls to scraper, filter out no-op fields, patch via admin client. Logs structured `[cron:sold-out]` entries per event. Authenticated with `CRON_SECRET` bearer.
- `vercel.json` — schedule `0 8 * * *` (08:00 UTC daily).
- Added `CRON_SECRET` to `.env.example`.

---

## Connection audit (Phase Review item)

| Connection | OK |
|---|---|
| Admin import page → import-form → /api/superadmin/import/analyze | ✓ |
| /api/superadmin/import/analyze → `analyzeUrl` / `analyzeText` → Render `/analyze/url` / `/analyze/text` | ✓ |
| Save route → `saveScrapedEvent` → Supabase `events` insert | ✓ |
| `/api/scraper/events` (Chrome extension) → `saveScrapedEvent` (shared helper) | ✓ |
| RecheckPanel → `/api/superadmin/events/[id]/recheck` → Render `/recheck` | ✓ |
| RecheckPanel apply → existing PATCH `/api/superadmin/events/[id]` | ✓ |
| RecurrenceNaturalInput → `/api/superadmin/parse-recurrence` → Render `/parse/recurrence` | ✓ |
| SeriesEditForm RecurrenceSection → PATCH `/api/superadmin/series/[id]` | ✓ |
| Vercel cron → `/api/cron/recheck-sold-out` → Render `/check-sold-out` → PATCH `events` via admin client | ✓ |
| `SCRAPER_API_URL` + `SCRAPER_API_SECRET` + `CRON_SECRET` in `.env.example` | ✓ |
| Scraper `routes/analyze-url.js` + `routes/recheck.js` + `routes/parse-recurrence.js` + `routes/check-sold-out.js` registered in `index.js` | ✓ |
| Admin sidebar shows "Import" link | ✓ |

---

## Gotchas surfaced (and how they're handled)

- **Float drift in prices** — $24.99 vs $25.00 across ticket hosts would otherwise flood the diff. `recheck.js` uses an epsilon of 0.005.
- **Multi-event recheck** — if a re-scraped page now returns multi (e.g. a venue page that got added dates), we match against the caller's snapshot by `start_datetime` day, falling back to title, falling back to index 0. Imperfect but the common case is a single-event detail page.
- **Duplicate venue creation in import batches** — save path is sequential, not parallel, so two events in one paste that share a venue don't race to create duplicate `locations` rows.
- **Category + organizer in recheck diff** — flagged as `not auto-applied`. Writing `category_slug` raw would create an invalid FK; organizer name needs resolution. Marked as informational in the diff UI.
- **Cron timeout** — BATCH_LIMIT=30 + sequential calls keeps us well inside 300s.
- **Cron no-op writes** — after getting the scraper response, we drop fields that match current DB values BEFORE writing, so audit logs don't fill with noise.
- **Auth double-gate** — every superadmin API route checks `isSuperAdmin(session.email)` even though the scraper itself is secret-auth'd. If a server page rendering fails, at least the API is still gated.

---

## What was intentionally deferred

- **Override → flat column promotion** (from earlier tagging work) is still a TODO, unchanged by this phase.
- **Image import during URL analyze** — the scraper returns `image_url` references from og-tags but we don't rehost to Supabase Storage during import yet. The Chrome extension flow still does that via `/api/images/upload`. Admin import relies on cards/details showing the external URL until a human edits the event.
- **Bulk cron retry** — a single 5xx from the scraper skips one event. We rely on the next nightly run to retry. No per-event retry-with-backoff.

---

## Credentials / env to configure

See the companion **Scraper Integration Credentials Checklist** in the main `CLAUDE.md` (in the "Scraper Integration" section).
