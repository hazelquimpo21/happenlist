/**
 * ADMIN ENTITY CATALOG
 * ====================
 * Single source of truth for the four admin-managed directory entities:
 * organizers, venues, performers, membership_organizations.
 *
 * Every admin page, API route, fetcher, and sidebar link imports from here.
 * Don't duplicate any of these strings anywhere else.
 *
 * Key asymmetry: "venue" in the UI ↔ `locations` table in the database.
 * This mapping lives HERE and nowhere else — downstream code reads `tableName`
 * and never hardcodes 'locations' when it means "venue".
 *
 * If you change this, also update:
 *   - src/data/superadmin/superadmin-entity-actions.ts (TABLE_MAP + EntityType union)
 *   - src/components/admin/admin-sidebar.tsx (Directory section entries)
 *   - supabase/migrations (if adding/renaming columns)
 */

import type { LucideIcon } from 'lucide-react';
import { Users, MapPin, Mic, Ticket } from 'lucide-react';

// ============================================================================
// ENTITY KIND
// ============================================================================

/** Canonical admin-entity identifiers. URL slugs and API paths are derived from these. */
export const ADMIN_ENTITY_KINDS = [
  'organizer',
  'venue',
  'performer',
  'membership_org',
] as const;

export type AdminEntityKind = (typeof ADMIN_ENTITY_KINDS)[number];

// ============================================================================
// CATALOG
// ============================================================================

export interface AdminEntityMeta {
  kind: AdminEntityKind;
  /** Singular human label, e.g. "Organizer" */
  label: string;
  /** Plural human label, e.g. "Organizers" */
  labelPlural: string;
  /** Database table name (note: venue → 'locations') */
  tableName: string;
  /** Admin URL segment — `/admin/{urlSlug}` */
  urlSlug: string;
  /** API route segment — `/api/superadmin/{apiSlug}` */
  apiSlug: string;
  /** Public detail-page URL prefix — `/{publicSlug}/<slug>` */
  publicSlug: string;
  /** Which event-link table to count through for event_count */
  eventCountSource:
    | { kind: 'direct'; column: 'organizer_id' | 'location_id' }
    | { kind: 'join'; joinTable: string; joinColumn: string };
  icon: LucideIcon;
}

export const ADMIN_ENTITIES: Record<AdminEntityKind, AdminEntityMeta> = {
  organizer: {
    kind: 'organizer',
    label: 'Organizer',
    labelPlural: 'Organizers',
    tableName: 'organizers',
    urlSlug: 'organizers',
    apiSlug: 'organizers',
    publicSlug: 'organizer',
    eventCountSource: { kind: 'direct', column: 'organizer_id' },
    icon: Users,
  },
  venue: {
    kind: 'venue',
    label: 'Venue',
    labelPlural: 'Venues',
    tableName: 'locations',
    urlSlug: 'venues',
    apiSlug: 'venues',
    publicSlug: 'venue',
    eventCountSource: { kind: 'direct', column: 'location_id' },
    icon: MapPin,
  },
  performer: {
    kind: 'performer',
    label: 'Performer',
    labelPlural: 'Performers',
    tableName: 'performers',
    urlSlug: 'performers',
    apiSlug: 'performers',
    publicSlug: 'performer',
    eventCountSource: { kind: 'join', joinTable: 'event_performers', joinColumn: 'performer_id' },
    icon: Mic,
  },
  membership_org: {
    kind: 'membership_org',
    label: 'Membership Org',
    labelPlural: 'Membership Orgs',
    tableName: 'membership_organizations',
    urlSlug: 'membership-orgs',
    apiSlug: 'membership-orgs',
    publicSlug: 'membership',
    eventCountSource: { kind: 'join', joinTable: 'event_membership_benefits', joinColumn: 'membership_org_id' },
    icon: Ticket,
  },
};

/** Convenience: iterate all four entities in sidebar order. */
export const ADMIN_ENTITY_LIST: readonly AdminEntityMeta[] = ADMIN_ENTITY_KINDS.map(
  (k) => ADMIN_ENTITIES[k]
);
