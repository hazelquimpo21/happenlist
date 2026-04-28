/**
 * Series edit form — shared helpers, constants, and types
 * =========================================================
 * Mirror of event-edit-form/helpers.ts for the series surface.
 *
 * @module components/superadmin/series-edit-form/helpers
 */
import type { SeriesRow } from '@/types/series';

export interface SeriesFormState {
  title: string;
  description: string;
  short_description: string;
  series_type: string;
  status: string;
  price_type: string;
  price_low: string;
  price_high: string;
  is_free: boolean;
  registration_url: string;
  image_url: string;
  meta_title: string;
  meta_description: string;
  is_featured: boolean;
}

export type SeriesFormStatus = 'idle' | 'saving' | 'saved' | 'error';

export const SERIES_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const SERIES_TYPES = [
  { value: 'class', label: 'Class' },
  { value: 'camp', label: 'Camp' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'festival', label: 'Festival' },
  { value: 'season', label: 'Season' },
];

export const SERIES_PRICE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'varies', label: 'Varies' },
  { value: 'per_session', label: 'Per Session' },
];

export function deriveInitialSeriesFormState(series: SeriesRow): SeriesFormState {
  return {
    title: series.title || '',
    description: series.description || '',
    short_description: series.short_description || '',
    series_type: series.series_type || 'class',
    status: series.status || 'draft',
    price_type: series.price_type || 'free',
    price_low: series.price_low?.toString() || '',
    price_high: series.price_high?.toString() || '',
    is_free: series.is_free ?? false,
    registration_url: series.registration_url || '',
    image_url: series.image_url || '',
    meta_title: series.meta_title || '',
    meta_description: series.meta_description || '',
    is_featured: series.is_featured ?? false,
  };
}
