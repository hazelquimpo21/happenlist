/**
 * SUPERADMIN PERFORMER CREATE ROUTE
 * =================================
 * POST /api/superadmin/performers
 */

import { createEntityRoute } from '@/lib/api/entity-create-handler';

export const POST = createEntityRoute('performer', (raw) => {
  const values: Record<string, unknown> = {};
  const stringOrNull = (k: string) => {
    if (typeof raw[k] === 'string') values[k] = (raw[k] as string).trim() || null;
    else if (raw[k] === null) values[k] = null;
  };
  stringOrNull('bio');
  stringOrNull('genre');
  stringOrNull('image_url');
  stringOrNull('website_url');
  return { ok: true, values };
});
