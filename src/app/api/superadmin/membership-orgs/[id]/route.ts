/**
 * SUPERADMIN MEMBERSHIP ORG ROUTE
 * PATCH + DELETE via shared factory.
 */

import { patchEntityRoute, deleteEntityRoute } from '@/lib/api/entity-edit-handlers';

export const PATCH = patchEntityRoute('membership_org');
export const DELETE = deleteEntityRoute('membership_org');
