/**
 * SUPERADMIN VENUE CREATE ROUTE
 * =============================
 * POST /api/superadmin/venues
 * Writes to the `locations` table. `name` and `city` are NOT NULL.
 */

import { createEntityRoute } from '@/lib/api/entity-create-handler';

export const POST = createEntityRoute('venue', (raw) => {
  const city = typeof raw.city === 'string' ? raw.city.trim() : '';
  if (!city) return { ok: false, error: 'City is required' };

  const values: Record<string, unknown> = { city };

  const stringOrNull = (k: string) => {
    if (typeof raw[k] === 'string') values[k] = (raw[k] as string).trim() || null;
    else if (raw[k] === null) values[k] = null;
  };
  stringOrNull('description');
  stringOrNull('address_line');
  stringOrNull('address_line_2');
  stringOrNull('state');
  stringOrNull('postal_code');
  stringOrNull('website_url');
  stringOrNull('phone');
  stringOrNull('image_url');
  stringOrNull('meta_title');
  stringOrNull('meta_description');

  // venue_type has a CHECK-ish use downstream; default to 'venue' if empty.
  values.venue_type =
    typeof raw.venue_type === 'string' && raw.venue_type.trim() ? raw.venue_type.trim() : 'venue';
  values.source = 'manual';
  values.country = 'US';

  return { ok: true, values };
});
