/**
 * CARD → PEEK STUB adapter
 * =====================================================================
 * EventCard (the grid card shape) and EventWithDetails (the full detail
 * shape) overlap on ~80% of fields but have different structures for
 * nested entities (category, location, organizer).
 *
 * This adapter produces a PARTIAL `EventWithDetails` from card data so
 * the peek sheet can render instantly on open — title, image, date,
 * category, price, vibe tags all flow through. Fields that only the
 * full fetch can provide (ticket_url, full description, organizer bio,
 * etc.) are filled in once the fetch resolves.
 *
 * This file is small on purpose. It is NOT a type-safe full adapter —
 * many EventRow columns are set to safe defaults. Consumers must treat
 * the stub as "enough to paint, not enough to transact".
 *
 * USED BY:
 *   - src/components/events/peek/peek-host.tsx
 *
 * If EventCard or EventWithDetails gain new fields the peek wants to
 * show instantly, add them here.
 * =====================================================================
 */

import type { EventCard, EventWithDetails } from '@/types';

export function cardToPeekStub(card: EventCard): EventWithDetails {
  // The EventRow base requires many columns; we fill with null/defaults.
  // Unknown type gymnastics — this is a boundary, trust the boundary.
  return {
    id: card.id,
    title: card.title,
    slug: card.slug,
    start_datetime: card.start_datetime,
    instance_date: card.instance_date,
    image_url: card.image_url,
    thumbnail_url: card.thumbnail_url,
    price_type: card.price_type,
    price_low: card.price_low,
    price_high: card.price_high,
    is_free: card.is_free,
    heart_count: card.heart_count,
    short_description: card.short_description ?? null,
    // Full description will arrive with the fetch. Null here makes the
    // peek fall back to short_description cleanly.
    description: null,
    vibe_tags: card.vibe_tags ?? null,
    access_type: card.access_type ?? null,
    noise_level: card.noise_level ?? null,
    age_restriction: card.age_restriction ?? null,
    is_family_friendly: card.is_family_friendly ?? null,
    parent_event_id: card.parent_event_id ?? null,
    series_id: card.series_id ?? null,
    child_event_count: card.child_event_count,
    // Nested entities — reshape card's flat fields into the peek's
    // expected nested objects.
    category: card.category_slug
      ? {
          id: '', // unused by peek
          name: card.category_name ?? '',
          slug: card.category_slug,
          icon: null,
        }
      : null,
    location: card.location_name
      ? {
          id: '',
          name: card.location_name,
          slug: card.location_slug ?? '',
          city: null,
          state: null,
          address_line: null,
          address_line_2: null,
          postal_code: null,
          latitude: null,
          longitude: null,
          venue_type: null,
          website_url: null,
        }
      : null,
    organizer: card.organizer_name
      ? {
          id: '',
          name: card.organizer_name,
          slug: '',
          logo_url: null,
          description: null,
          website_url: null,
        }
      : null,
    // Primary CTA (Get tickets) needs ticket_url. Card doesn't carry it
    // — peek will show only "View full details" until the fetch fills
    // it in. That's fine: the transition is subtle.
    ticket_url: null,
    // Remaining EventRow columns we don't need — cast through unknown
    // to bypass strict typing for this intentional stub.
  } as unknown as EventWithDetails;
}
