/**
 * Initial form state derivation
 * ==============================
 * Pure helper that derives a FormState snapshot from an AdminEventDetails
 * record. Reused for both the initial useState and the "original" snapshot
 * passed to useFormDirtyState (so dirty diff is symmetric).
 *
 * @module components/superadmin/event-edit-form/initial-form-state
 */
import { isHours } from '@/lib/events/hours-schema';
import type { AdminEventDetails } from '@/data/admin/get-admin-event';
import { formatDateTimeLocal, type FormState } from './helpers';

export function deriveInitialFormState(event: AdminEventDetails): FormState {
  return {
    title: event.title || '',
    description: event.description || '',
    short_description: event.short_description || '',
    start_datetime: event.start_datetime ? formatDateTimeLocal(event.start_datetime) : '',
    end_datetime: event.end_datetime ? formatDateTimeLocal(event.end_datetime) : '',
    is_all_day: event.is_all_day || false,
    price_type: event.price_type || 'free',
    price_low: event.price_low?.toString() || '',
    price_high: event.price_high?.toString() || '',
    is_free: event.is_free || false,
    ticket_url: event.ticket_url || '',
    website_url: event.website_url || '',
    instagram_url: event.instagram_url || '',
    facebook_url: event.facebook_url || '',
    registration_url: event.registration_url || '',
    good_for: event.good_for || [],
    accessibility_tags:
      (event as { accessibility_tags?: string[] | null }).accessibility_tags || [],
    sensory_tags: (event as { sensory_tags?: string[] | null }).sensory_tags || [],
    leave_with: (event as { leave_with?: string[] | null }).leave_with || [],
    social_mode: (event as { social_mode?: string | null }).social_mode || '',
    energy_needed: (event as { energy_needed?: string | null }).energy_needed || '',
    music_genres: (event as { music_genres?: string[] | null }).music_genres || [],
    image_url: event.image_url || '',
    category_id: event.category_id || '',
    status: event.status || 'draft',
    hours: (() => {
      const raw = (event as { hours?: unknown }).hours;
      return isHours(raw) ? raw : null;
    })(),
    parent_event_id:
      (event as { parent_event_id?: string | null }).parent_event_id || '',
  };
}
