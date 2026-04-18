/**
 * SUPERADMIN VENUE ROUTE
 * PATCH /api/superadmin/venues/[id] — edit any venue (table: locations)
 * DELETE /api/superadmin/venues/[id] — soft-delete (is_active=false)
 *
 * See entity-edit-handlers.ts for the shared factory.
 */

import { patchEntityRoute, deleteEntityRoute } from '@/lib/api/entity-edit-handlers';

export const PATCH = patchEntityRoute('venue');
export const DELETE = deleteEntityRoute('venue');
