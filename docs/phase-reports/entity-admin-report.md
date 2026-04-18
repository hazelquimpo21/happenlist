# Entity Admin CRUD — Phase Report

**Date:** 2026-04-18
**Scope:** Adding full admin CRUD surfaces for Organizers, Venues, Performers, Membership Orgs.
**Decisions doc:** [entity-admin-decisions.md](./entity-admin-decisions.md)

---

## What shipped

### Migrations
- `supabase/migrations/20260418_1200_entity_admin_is_active.sql` — adds `is_active` to `performers` so soft-delete works uniformly across all four entities. Partial index on `is_active = false` (cheap; tiny working set).

### New shared primitives (the "source of truth" layer)
| File | Purpose |
|---|---|
| [admin-entities.ts](../../src/lib/constants/admin-entities.ts) | Single catalog of all four entities: UI label, DB table name (note: `venue → locations`), URL slugs, API slugs, event-count join info, sidebar icon. Every downstream file reads from here. |
| [get-admin-entities.ts](../../src/data/admin/get-admin-entities.ts) | One generic paginated/searchable fetcher, dispatches on `AdminEntityKind`. Per-entity select-columns + row-mapping live in a `SELECT_CONFIG` table so adding a fifth kind is ~20 lines. |
| [entity-list-page.tsx](../../src/components/admin/entity-list-page.tsx) | One server component that renders the whole list UI (header, search, tabs, filters, grid, pagination). Per-entity pages are ~15-line wrappers that pass `kind` + extra filter specs. |
| [entity-card-grid.tsx](../../src/components/admin/entity-card-grid.tsx) | Card grid, no bulk-select v1. |
| [entity-form-shell.tsx](../../src/components/superadmin/entity-form-shell.tsx) | The major refactor. Extracts the ~200 lines/form of status bar + notes + save/delete buttons + delete modal + network orchestration into a hook (`useEntityForm`) + small presentational components. Per-entity form = fields + `buildCreatePayload` + `buildUpdateDiff`. |
| [entity-create-handler.ts](../../src/lib/api/entity-create-handler.ts) | Shared POST factory — auth + body parse + auto-slug + call `superadminCreateEntity`. Each entity's `route.ts` is ~20 lines. |
| [entity-edit-handlers.ts](../../src/lib/api/entity-edit-handlers.ts) | Shared PATCH + DELETE factory. Existing organizer + venue `[id]/route.ts` refactored down to 12 lines each (from ~125). |

### Per-entity files

**Data layer:**
- All four go through `getAdminEntities(kind, filters)`. No per-entity fetchers — a single file handles everything.
- [get-organizers-for-picker.ts](../../src/data/admin/get-organizers-for-picker.ts) — thin helper for the membership-org form's organizer dropdown.

**Superadmin actions:**
- [superadmin-entity-actions.ts](../../src/data/superadmin/superadmin-entity-actions.ts) — extended `SuperadminEntityType` to the five kinds. Added `superadminCreateEntity()`. Maps `23505` (unique_violation) to a friendly "slug already taken" error.

**Pages:**
| Entity | List | New | Edit |
|---|---|---|---|
| Organizers | `/admin/organizers` (new) | `/admin/organizers/new` (new) | `/admin/organizers/[id]/edit` (pre-existing) |
| Venues | `/admin/venues` (new) | `/admin/venues/new` (new) | `/admin/venues/[id]/edit` (pre-existing) |
| Performers | `/admin/performers` (new) | `/admin/performers/new` (new) | `/admin/performers/[id]/edit` (new) |
| Membership Orgs | `/admin/membership-orgs` (new) | `/admin/membership-orgs/new` (new) | `/admin/membership-orgs/[id]/edit` (new) |

**Forms (dual-mode: create + edit):**
- [organizer-edit-form.tsx](../../src/components/superadmin/organizer-edit-form.tsx) — migrated to shell
- [venue-edit-form.tsx](../../src/components/superadmin/venue-edit-form.tsx) — migrated to shell
- [performer-edit-form.tsx](../../src/components/superadmin/performer-edit-form.tsx) — new
- [membership-org-edit-form.tsx](../../src/components/superadmin/membership-org-edit-form.tsx) — new

**API routes:**
- `POST /api/superadmin/{organizers|venues|performers|membership-orgs}` — all share `createEntityRoute()` factory
- `PATCH + DELETE /api/superadmin/{…}/[id]` — all share `patchEntityRoute()`/`deleteEntityRoute()` factory

**Sidebar:**
- [admin-sidebar.tsx](../../src/components/admin/admin-sidebar.tsx) — new "Directory" section that iterates `ADMIN_ENTITY_LIST`. Never gets out of sync with the constants file.

---

## Refactor opportunities surfaced + executed

1. **Form-shell extraction.** Every admin form had the same ~200 lines of status/notes/buttons/delete-modal boilerplate. Extracted into `useEntityForm` hook + sub-components. Organizer + venue were also migrated to the new shell (they'd have drifted otherwise).
2. **API route factories.** Organizer + venue `[id]/route.ts` were near-duplicates (125 lines each). Collapsed to 12 lines each. Same pattern now used for all five entity kinds (including series — though series still uses a legacy route).
3. **List-page scaffolding.** Collapsed to one `<EntityListPage>` + per-entity 15-line wrappers. Adding a new admin-managed entity is now ~4 small files instead of ~1,200 lines.

---

## Bug-scan (per engineering standards phase-review ritual)

### Found + fixed
| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | High | `getAdminEntities` called `supabase.from(meta.tableName)` with a dynamic string — Supabase client generics are too strict. TS errored. | Cast client to `any` at the entry. Same fix applied in `superadmin-entity-actions.ts` (edit + delete paths). |
| 2 | Medium | `buildStringDiff(initial as Record<string, unknown>, …)` failed TS2352 on all four forms — cast went through a non-overlapping type. | Cast through `unknown`: `initial as unknown as Record<string, unknown>`. |
| 3 | Medium | Old organizer edit page passed `organizer={…}` directly; new form requires `mode="edit"` discriminant. | Updated edit page to pass `mode="edit"`. Same fix for venue edit page. |
| 4 | Low | `SuperadminOrganizerEditForm` was being used on the existing `/admin/organizers/[id]/edit` page with the old single-mode props. | Form refactored to dual-mode shell; edit page updated. |

### Connection audit passed
- `ADMIN_ENTITY_LIST` → consumed by sidebar ✓
- New migration `is_active` on performers → consumed by shell's delete path, list fetcher, card grid ✓
- New `superadminCreateEntity` → consumed by `createEntityRoute` → consumed by all four POST routes ✓
- New `SuperadminEntityType` union includes all five kinds → `TABLE_MAP` + `SOFT_DELETE_ENTITIES` updated ✓
- Each entity's `publicSlug` in `admin-entities.ts` matches actual public route structure (`/organizer/<slug>`, `/venue/<slug>`, `/performer/<slug>`, `/membership/<slug>`) — spot-checked ✓

### Gotcha brainstorm
- **Event-count N+1 pattern.** Each list page fires 20 parallel count-only queries. Fine at 20/page but would be prohibitive at higher limits — mirrored from existing `get-admin-series.ts`. **Action:** noted, no change. If we ever bump page size >50, migrate to a single aggregated query.
- **Locations table has 3,485 rows.** Pagination is load-bearing; default ordering is `created_at desc nulls last`. Tested: venues list paginates cleanly with 20/page.
- **Inactive rows visibility.** Admin list uses `createAdminClient()` (service-role) so RLS doesn't hide `is_active=false` rows. Edit page for performers/membership-orgs also uses admin client (newly written); verified organizer + venue edit pages use `createClient` which could hit RLS for inactive rows — **pre-existing, not introduced here, flagging as follow-up.**
- **Slug collisions.** 23505 maps to a user-readable error. Not tested end-to-end because the test would require creating two entities with matching names — low risk, well-scoped.
- **Membership org → organizer_id FK.** Tested picker renders the list; `null` is valid (FK allows null per schema). Create flow handles empty-string → null correctly.
- **Existing series admin untouched.** Series has its own list + merge + bulk-delete UI — confirmed no imports from the new primitives collide with series.
- **Auth redirect paths.** Each /new page redirects to `/auth/login?redirect=/admin/<urlSlug>/new`. Verified in dev by hitting the routes — clean 307.
- **Public performer/membership_org routes.** The form uses a "Back to <entity>" link pointing at the public detail page. For performers this is `/performer/<slug>`; for membership orgs it's `/membership/<slug>`. Both routes exist per prior work — spot-checked via the data-layer file headers.

### Accepted trade-offs
- No bulk-select / merge UI for any of the four entities v1. Series has both but they're cheap to copy if needed.
- No hard-delete. Soft-delete only. If you need to actually delete an organizer with zero events, do it in SQL or add a "delete forever" button later.
- `inferred_signals` etc. on events table NOT touched — this PR doesn't affect the tagging-expansion work.
- Supabase generated types NOT regenerated — pre-existing as-any casts match the project convention.
- Generic table-name casts use `(supabase as any)` per house style (same as `get-admin-series.ts`, `superadmin-event-actions.ts`). Regenerating types would remove ~15 casts across the module, but that's out of scope.

---

## Verification

- ✅ `npx tsc --noEmit` — clean, no errors.
- ✅ `npx next lint` — clean (only pre-existing warnings in other files).
- ✅ Dev server compiled all 12 new routes (4 lists + 4 news + 2 new edit pages + sidebar + shell).
- ✅ All four list pages hit DB, render correct event-counts, show pagination.
- ✅ Screenshotted organizers list — Directory sidebar section visible, "New Organizer" button wired, 42 orgs paginating.
- ⚠️ End-to-end create / edit / deactivate flow NOT exercised — requires a superadmin session. Routes return 200 / 307 correctly per auth status. Form logic tested by TS + code review only.

---

## File inventory

### New files
```
docs/phase-reports/entity-admin-decisions.md
docs/phase-reports/entity-admin-report.md
supabase/migrations/20260418_1200_entity_admin_is_active.sql

src/lib/constants/admin-entities.ts
src/lib/api/entity-create-handler.ts
src/lib/api/entity-edit-handlers.ts

src/data/admin/get-admin-entities.ts
src/data/admin/get-organizers-for-picker.ts

src/components/admin/entity-card-grid.tsx
src/components/admin/entity-list-page.tsx
src/components/superadmin/entity-form-shell.tsx
src/components/superadmin/performer-edit-form.tsx
src/components/superadmin/membership-org-edit-form.tsx

src/app/admin/organizers/page.tsx
src/app/admin/organizers/new/page.tsx
src/app/admin/venues/page.tsx
src/app/admin/venues/new/page.tsx
src/app/admin/performers/page.tsx
src/app/admin/performers/new/page.tsx
src/app/admin/performers/[id]/edit/page.tsx
src/app/admin/membership-orgs/page.tsx
src/app/admin/membership-orgs/new/page.tsx
src/app/admin/membership-orgs/[id]/edit/page.tsx

src/app/api/superadmin/organizers/route.ts
src/app/api/superadmin/venues/route.ts
src/app/api/superadmin/performers/route.ts
src/app/api/superadmin/performers/[id]/route.ts
src/app/api/superadmin/membership-orgs/route.ts
src/app/api/superadmin/membership-orgs/[id]/route.ts
```

### Modified files
```
src/components/admin/index.ts                              (exports)
src/components/admin/admin-sidebar.tsx                     (Directory section)
src/components/superadmin/index.ts                         (exports)
src/components/superadmin/organizer-edit-form.tsx          (migrated to shell)
src/components/superadmin/venue-edit-form.tsx              (migrated to shell)
src/data/admin/index.ts                                    (exports)
src/data/superadmin/index.ts                               (exports)
src/data/superadmin/superadmin-entity-actions.ts           (5-kind support + create)
src/app/admin/organizers/[id]/edit/page.tsx                (mode="edit")
src/app/admin/venues/[id]/edit/page.tsx                    (mode="edit")
src/app/api/superadmin/organizers/[id]/route.ts            (factory)
src/app/api/superadmin/venues/[id]/route.ts                (factory)
```

---

## Follow-ups (not blocking)

1. **Bulk-select + soft-delete bulk action** on entity grids — mirror `admin-series-grid.tsx`.
2. **Merge UI** for organizers + venues — same pattern as series merge.
3. **Hard-delete** behind a "delete forever" button when `event_count === 0`.
4. **Inactive rows in edit pages.** Organizer/venue edit pages use the regular client — confirm they can load an `is_active=false` row after a superadmin deactivates it. If not, switch to `createAdminClient()`.
5. **Regenerate Supabase types** (`npx supabase gen types typescript`) — would remove the casts on generic-table-name queries.
6. **End-to-end smoke test** as a superadmin: create → edit → deactivate → reactivate cycle on each of the four entities.
