/**
 * SUPERADMIN PERFORMER ROUTE
 * PATCH + DELETE via shared factory.
 */

import { patchEntityRoute, deleteEntityRoute } from '@/lib/api/entity-edit-handlers';

export const PATCH = patchEntityRoute('performer');
export const DELETE = deleteEntityRoute('performer');
