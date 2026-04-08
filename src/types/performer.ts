/**
 * PERFORMER TYPES
 * ===============
 * Type definitions for performers/artists linked to events.
 */

/**
 * A performer (artist, DJ, speaker, comedian, etc.).
 */
export interface Performer {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  genre: string | null;
  image_url: string | null;
  website_url: string | null;
}

/**
 * Junction record linking a performer to an event, with role and billing order.
 */
export interface EventPerformer {
  id: string;
  performer_id: string;
  role: string;
  billing_order: number;
  performer: Performer;
}

/**
 * Performer with aggregated event count (for directory listings).
 */
export interface PerformerWithCount extends Performer {
  event_count: number;
}

/**
 * Performer card data for grids/lists.
 */
export interface PerformerCard {
  id: string;
  name: string;
  slug: string;
  genre: string | null;
  image_url: string | null;
  upcoming_event_count: number;
}

/**
 * Human-readable labels for performer roles.
 */
export const PERFORMER_ROLE_LABELS: Record<string, string> = {
  headliner: 'Headliner',
  support: 'Support',
  dj: 'DJ',
  speaker: 'Speaker',
  host: 'Host',
  comedian: 'Comedian',
  artist: 'Artist',
  performer: 'Performer',
};

/**
 * Get a display label for a performer role.
 */
export function getPerformerRoleLabel(role: string): string {
  return PERFORMER_ROLE_LABELS[role] || role.charAt(0).toUpperCase() + role.slice(1);
}
