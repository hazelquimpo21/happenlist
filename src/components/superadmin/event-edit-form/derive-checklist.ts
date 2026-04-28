/**
 * Derive QuickChecklist items from live form state
 * ==================================================
 * Translates the operator's "is this event ready to publish?" mental model
 * into a list of pass/fail indicators. Each item links to the section
 * where the field can be edited.
 *
 * Items are intentionally simple — the goal is "skim before you publish",
 * not deep validation. Real validation happens server-side.
 *
 * @module components/superadmin/event-edit-form/derive-checklist
 */
import type { ChecklistItem } from '@/components/admin/form-shell';
import type { FormState } from './helpers';

export function deriveEventChecklist(
  formState: FormState,
  hasVenue: boolean,
): ChecklistItem[] {
  const startDate = formState.start_datetime ? new Date(formState.start_datetime) : null;
  const isFutureOrAllDay = (() => {
    if (formState.is_all_day) return true;
    if (formState.hours) return true; // ongoing-with-hours doesn't need a future single date
    if (!startDate) return false;
    return startDate.getTime() >= Date.now();
  })();

  return [
    {
      key: 'title',
      label: 'Has title',
      ok: formState.title.trim().length > 0,
      jumpTo: 'basics',
      hint: 'Add a clear event title',
    },
    {
      key: 'image',
      label: 'Has image',
      ok: !!formState.image_url,
      jumpTo: 'basics',
      hint: 'Add a hero image — cards look empty without one',
    },
    {
      key: 'short',
      label: 'Short description',
      ok: formState.short_description.trim().length > 0,
      jumpTo: 'basics',
      hint: 'Required for cards',
    },
    {
      key: 'category',
      label: 'Has category',
      ok: !!formState.category_id,
      jumpTo: 'basics',
      hint: 'Drives card color and category browsing',
    },
    {
      key: 'date',
      label: 'Date set',
      ok: !!formState.start_datetime || formState.is_all_day || !!formState.hours,
      jumpTo: 'when',
      hint: 'Add a start date or weekly hours',
    },
    {
      key: 'future',
      label: 'Date in future',
      ok: isFutureOrAllDay,
      jumpTo: 'when',
      hint: 'Past dates are hidden from the main feed',
    },
    {
      key: 'venue',
      label: 'Has venue',
      ok: hasVenue,
      jumpTo: 'where',
      hint: 'Required for distance and neighborhood filters',
    },
  ];
}
