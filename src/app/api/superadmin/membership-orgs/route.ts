/**
 * SUPERADMIN MEMBERSHIP ORG CREATE ROUTE
 * ======================================
 * POST /api/superadmin/membership-orgs
 */

import { createEntityRoute } from '@/lib/api/entity-create-handler';

export const POST = createEntityRoute('membership_org', (raw) => {
  const values: Record<string, unknown> = {};
  const stringOrNull = (k: string) => {
    if (typeof raw[k] === 'string') values[k] = (raw[k] as string).trim() || null;
    else if (raw[k] === null) values[k] = null;
  };
  stringOrNull('description');
  stringOrNull('website_url');
  stringOrNull('logo_url');
  // organizer_id is a UUID — pass through when present, otherwise null.
  if (typeof raw.organizer_id === 'string' && raw.organizer_id.length > 0) {
    values.organizer_id = raw.organizer_id;
  } else if (raw.organizer_id === null) {
    values.organizer_id = null;
  }
  return { ok: true, values };
});
