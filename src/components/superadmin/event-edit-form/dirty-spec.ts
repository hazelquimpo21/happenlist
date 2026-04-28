/**
 * Dirty-state field spec for the event edit form
 * ================================================
 * Drives `useFormDirtyState` — every field gets a label, section id, and
 * comparator. The output powers the section TOC dirty dots, the command
 * bar "Save changes (N)" count, and the "What changed" sidebar diff.
 *
 * Section ids match `EVENT_FORM_SECTIONS` in admin-form-sections.ts.
 *
 * @module components/superadmin/event-edit-form/dirty-spec
 */
import type { DirtyFieldSpec } from '@/lib/admin/use-form-dirty-state';
import type { FormState } from './helpers';

export const EVENT_FORM_DIRTY_SPEC: readonly DirtyFieldSpec<FormState>[] = [
  // basics
  { key: 'title', label: 'Title', section: 'basics' },
  { key: 'short_description', label: 'Short description', section: 'basics' },
  { key: 'description', label: 'Full description', section: 'basics' },
  { key: 'image_url', label: 'Image', section: 'basics' },
  { key: 'category_id', label: 'Category', section: 'basics' },

  // when
  { key: 'start_datetime', label: 'Start', section: 'when' },
  { key: 'end_datetime', label: 'End', section: 'when' },
  { key: 'is_all_day', label: 'All-day', section: 'when', compare: 'boolean' },
  { key: 'hours', label: 'Weekly hours', section: 'when', compare: 'json' },

  // money & links
  { key: 'price_type', label: 'Price type', section: 'money' },
  { key: 'price_low', label: 'Price low', section: 'money', compare: 'number' },
  { key: 'price_high', label: 'Price high', section: 'money', compare: 'number' },
  { key: 'ticket_url', label: 'Ticket URL', section: 'money' },
  { key: 'website_url', label: 'Website', section: 'money' },
  { key: 'registration_url', label: 'Registration URL', section: 'money' },
  { key: 'instagram_url', label: 'Instagram', section: 'money' },
  { key: 'facebook_url', label: 'Facebook', section: 'money' },

  // audience
  { key: 'good_for', label: 'Good for', section: 'audience', compare: 'array' },

  // vibe
  { key: 'accessibility_tags', label: 'Accessibility', section: 'vibe', compare: 'array' },
  { key: 'sensory_tags', label: 'Sensory', section: 'vibe', compare: 'array' },
  { key: 'leave_with', label: 'Leave with', section: 'vibe', compare: 'array' },
  { key: 'music_genres', label: 'Music genres', section: 'vibe', compare: 'array' },
  { key: 'social_mode', label: 'Social mode', section: 'vibe' },
  { key: 'energy_needed', label: 'Energy needed', section: 'vibe' },

  // series
  { key: 'parent_event_id', label: 'Parent event', section: 'series' },

  // system
  { key: 'status', label: 'Status', section: 'system' },
];
