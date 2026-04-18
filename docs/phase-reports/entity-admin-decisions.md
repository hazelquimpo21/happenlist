# Entity Admin CRUD — Decisions

**Date:** 2026-04-18
**Scope:** Adding full admin CRUD (list + create + edit + soft-delete) for Organizers, Venues, Performers, Membership Orgs. Existing Events/Series admin left untouched.

## Terminology

- **"Venue"** in the UI ↔ `locations` table in the DB. The table is not called `venues` — all `.from('locations')` references are venue operations. Preserve this in code comments.
- **"Organizer"**, **"Performer"**, **"Membership Org"** map 1:1 to `organizers`, `performers`, `membership_organizations`.

## Decisions

### 1. Soft-delete via `is_active=false`
Matches the pattern already used in [superadmin-entity-actions.ts](../../src/data/superadmin/superadmin-entity-actions.ts) for organizers/venues. Extends to performers + membership orgs. No hard-delete in v1 — preserves FK integrity with events.

**Schema gap fixed by migration `20260418_1200_entity_admin_is_active.sql`:**
- `performers` did not have `is_active`. Added with `DEFAULT true`.
- `membership_organizations` already had `is_active` — no change.

### 2. Slug auto-derive on create
Use existing [`generateSlug()`](../../src/lib/utils/slug.ts). On create, slug is read-only and derived from `name`. On edit, slug is editable (per existing organizer/venue edit pattern). Uniqueness enforced by DB `UNIQUE` constraint — surface `23505` as a friendly "slug already taken" error.

### 3. Audit trail via existing `admin_audit_log`
Reuse [`superadminEditEntity`](../../src/data/superadmin/superadmin-entity-actions.ts) and `superadminDeleteEntity`. Extend the `EntityType` union to `'organizer' | 'venue' | 'series' | 'performer' | 'membership_org'` and the `TABLE_MAP` accordingly. Also add a `superadminCreateEntity` sibling for the new "create" flow.

### 4. No bulk-select / no merge for v1
Series has bulk-delete + merge. Organizers/venues/performers/membership-orgs do not — keeps grids simple and ships faster. Easy to layer on later by mirroring `admin-series-grid.tsx`.

### 5. Sidebar: new "Directory" section
Four new entries grouped under "Directory" (below Series, above Reports). Icons: `Users` (organizers), `MapPin` (venues), `Mic` (performers), `Ticket` (membership orgs).

### 6. List filters per entity
| Entity | Status tab | Extra filters |
|---|---|---|
| Organizers | all / active / inactive | Verified? Membership org? |
| Venues | all / active / inactive | `venue_type` (venue/indoor/outdoor/other) |
| Performers | all / active / inactive | Genre (text search) |
| Membership Orgs | all / active / inactive | (none) |

All: name search (`ilike`), pagination (20/page), sort by `created_at desc` default.

### 7. Event-count sidecar
For each row show a `event_count` badge. Query via parallel `count(*)` HEAD queries, mirroring `get-admin-series.ts` pattern:
- Organizers: `events.organizer_id = X`
- Venues: `events.location_id = X`
- Performers: `event_performers.performer_id = X`
- Membership Orgs: `event_membership_benefits.membership_org_id = X`

### 8. Form field sets
Each entity gets ONE edit form component consumed by both `/new` and `/[id]/edit` pages via a `mode: 'create' | 'edit'` prop.

**Organizer fields** (already built): name, slug (edit-only), description, logo_url, website_url, email, phone, meta_title, meta_description, is_active, is_verified, is_membership_org.
**Venue fields**: name, slug (edit-only), description, address_line, address_line_2, city, state, postal_code, latitude, longitude, venue_type, website_url, phone, image_url, meta_title, meta_description, is_active.
**Performer fields**: name, slug (edit-only), bio, genre, image_url, website_url, is_active.
**Membership Org fields**: name, slug (edit-only), description, website_url, logo_url, organizer_id (picker / dropdown), is_active.

### 9. Shared primitives
Extract once — not four times:
- `src/components/admin/entity-list-page.tsx` — server component scaffolding list + search + status tabs + pagination.
- `src/components/admin/entity-card-grid.tsx` — client component for the card grid (no bulk-select in v1).
- `src/components/admin/entity-list-filters.ts` — URL-param parsing helpers (match `getEvents()` convention).
- `src/data/admin/entity-counts.ts` — parallel event-count fetcher.
- `src/lib/constants/admin-entities.ts` — single source of truth for entity slugs, labels, icons, table names, table name ↔ UI name mapping.

### 10. Create POST API
New routes: `POST /api/superadmin/organizers/route.ts`, `POST /api/superadmin/venues/route.ts`, `POST /api/superadmin/performers/route.ts`, `POST /api/superadmin/membership-orgs/route.ts`. All call a shared `superadminCreateEntity()`.

---

## Not doing

- Bulk operations (select, delete, merge) — follow-up
- Hard delete — follow-up, probably behind a "delete forever" confirm when `event_count===0`
- Claim flow UI changes — organizers has `claim_verified` etc. but that's a separate user-facing flow
- Generate Supabase types — inherited `eslint-disable` `any` casts where schema regen is out of scope
- Public-facing CRUD for any of these
