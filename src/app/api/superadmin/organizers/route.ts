/**
 * SUPERADMIN ORGANIZER CREATE ROUTE
 * =================================
 * POST /api/superadmin/organizers
 * Body: { name, description?, logo_url?, website_url?, email?, phone?,
 *         meta_title?, meta_description?, is_verified?, is_membership_org?, notes? }
 */

import { createEntityRoute } from '@/lib/api/entity-create-handler';

export const POST = createEntityRoute('organizer', (raw) => {
  const values: Record<string, unknown> = {};
  const stringOrNull = (k: string) => {
    if (typeof raw[k] === 'string') values[k] = (raw[k] as string).trim() || null;
    else if (raw[k] === null) values[k] = null;
  };
  stringOrNull('description');
  stringOrNull('logo_url');
  stringOrNull('website_url');
  stringOrNull('email');
  stringOrNull('phone');
  stringOrNull('meta_title');
  stringOrNull('meta_description');
  if (typeof raw.is_verified === 'boolean') values.is_verified = raw.is_verified;
  if (typeof raw.is_membership_org === 'boolean') values.is_membership_org = raw.is_membership_org;
  return { ok: true, values };
});
