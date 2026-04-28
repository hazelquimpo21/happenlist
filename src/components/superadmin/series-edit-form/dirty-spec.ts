/**
 * Dirty spec for the series edit form
 * =====================================
 * Each field maps to a tab id (matches SERIES_FORM_TABS in
 * admin-form-sections.ts).
 *
 * @module components/superadmin/series-edit-form/dirty-spec
 */
import type { DirtyFieldSpec } from '@/lib/admin/use-form-dirty-state';
import type { SeriesFormState } from './helpers';

export const SERIES_FORM_DIRTY_SPEC: readonly DirtyFieldSpec<SeriesFormState>[] = [
  { key: 'title', label: 'Title', section: 'details' },
  { key: 'short_description', label: 'Short description', section: 'details' },
  { key: 'description', label: 'Description', section: 'details' },
  { key: 'series_type', label: 'Type', section: 'details' },
  { key: 'status', label: 'Status', section: 'details' },
  { key: 'price_type', label: 'Price type', section: 'details' },
  { key: 'price_low', label: 'Price low', section: 'details', compare: 'number' },
  { key: 'price_high', label: 'Price high', section: 'details', compare: 'number' },
  { key: 'registration_url', label: 'Registration URL', section: 'details' },
  { key: 'image_url', label: 'Image', section: 'details' },
  { key: 'meta_title', label: 'Meta title', section: 'details' },
  { key: 'meta_description', label: 'Meta description', section: 'details' },
  { key: 'is_featured', label: 'Featured', section: 'details', compare: 'boolean' },
];
