/**
 * SUPERADMIN ORGANIZER ROUTE
 * PATCH /api/superadmin/organizers/[id] — edit any organizer
 * DELETE /api/superadmin/organizers/[id] — soft-delete (is_active=false)
 *
 * Both handlers are factory-generated — see entity-edit-handlers.ts.
 */

import { patchEntityRoute, deleteEntityRoute } from '@/lib/api/entity-edit-handlers';

export const PATCH = patchEntityRoute('organizer');
export const DELETE = deleteEntityRoute('organizer');
