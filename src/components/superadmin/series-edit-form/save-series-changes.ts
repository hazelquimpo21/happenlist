/**
 * Save handler for SuperadminSeriesEditForm
 * ============================================
 * Pure logic for diffing SeriesFormState vs. the saved record and issuing
 * the PATCH call. Extracted from the prior monolithic series-edit-form.tsx.
 *
 * Note: `is_free` is a generated column (computed from price_type) — never
 * include it in the updates payload.
 *
 * @module components/superadmin/series-edit-form/save-series-changes
 */
import type { SeriesRow } from '@/types/series';
import type { SeriesFormState } from './helpers';

export interface SaveSeriesContext {
  series: SeriesRow;
  formState: SeriesFormState;
  notes: string;
}

export interface SaveSeriesOutcome {
  noChanges: boolean;
}

export function buildSeriesUpdates(ctx: SaveSeriesContext): Record<string, unknown> {
  const { series, formState } = ctx;
  const updates: Record<string, unknown> = {};

  if (formState.title !== series.title) updates.title = formState.title;
  if (formState.description !== (series.description || '')) {
    updates.description = formState.description || null;
  }
  if (formState.short_description !== (series.short_description || '')) {
    updates.short_description = formState.short_description || null;
  }
  if (formState.series_type !== series.series_type) {
    updates.series_type = formState.series_type;
  }
  if (formState.status !== series.status) updates.status = formState.status;
  if (formState.price_type !== series.price_type) {
    updates.price_type = formState.price_type;
  }
  if (formState.registration_url !== (series.registration_url || '')) {
    updates.registration_url = formState.registration_url || null;
  }
  if (formState.image_url !== (series.image_url || '')) {
    updates.image_url = formState.image_url || null;
  }
  if (formState.meta_title !== (series.meta_title || '')) {
    updates.meta_title = formState.meta_title || null;
  }
  if (formState.meta_description !== (series.meta_description || '')) {
    updates.meta_description = formState.meta_description || null;
  }
  if (formState.is_featured !== series.is_featured) {
    updates.is_featured = formState.is_featured;
  }

  if (formState.price_type !== 'free') {
    const priceLow = formState.price_low ? parseFloat(formState.price_low) : null;
    const priceHigh = formState.price_high ? parseFloat(formState.price_high) : null;
    if (priceLow !== series.price_low) updates.price_low = priceLow;
    if (priceHigh !== series.price_high) updates.price_high = priceHigh;
  }

  return updates;
}

export async function saveSeriesChanges(ctx: SaveSeriesContext): Promise<SaveSeriesOutcome> {
  const updates = buildSeriesUpdates(ctx);
  if (Object.keys(updates).length === 0) {
    return { noChanges: true };
  }
  const res = await fetch(`/api/superadmin/series/${ctx.series.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, notes: ctx.notes || 'Superadmin edit' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save changes');
  }
  return { noChanges: false };
}
