/**
 * EVENT EDIT FORM — HEURISTIC EVENT HOOK
 * =======================================
 * Builds the live `HeuristicEvent` snapshot consumed by `FieldHeuristicFlag`.
 * Pulls mutable fields from formState and read-only fields (organizer, venue,
 * ai-gen flag) from the original event prop, so flags disappear as soon as the
 * operator fixes a field.
 *
 * Extracted from the original monolithic event-edit-form.tsx (2026-04-22 split).
 *
 * @module components/superadmin/event-edit-form/use-heuristic-event
 */

import type { HeuristicEvent } from '@/lib/admin/field-heuristics';
import type { AdminEventDetails } from '@/data/admin/get-admin-event';
import type { FormState } from './helpers';

export function useHeuristicEvent(
  event: AdminEventDetails,
  formState: FormState
): HeuristicEvent {
  return {
    title: formState.title,
    short_description: formState.short_description,
    description: formState.description,
    category_id: formState.category_id || null,
    organizer_name: (event as { organizer_name?: string | null }).organizer_name ?? null,
    organizer_is_venue: (event as { organizer_is_venue?: boolean | null }).organizer_is_venue ?? null,
    price_type: formState.price_type,
    price_low: formState.price_low ? parseFloat(formState.price_low) : null,
    price_high: formState.price_high ? parseFloat(formState.price_high) : null,
    ticket_url: formState.ticket_url,
    image_url: formState.image_url,
    image_ai_generated: (event as { image_ai_generated?: boolean | null }).image_ai_generated ?? null,
    location: event.location ? { name: event.location.name } : null,
  };
}
