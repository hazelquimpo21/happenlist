/**
 * 🦸 SUPERADMIN DATA MODULE
 * =========================
 * Server-side data operations for superadmin functionality.
 *
 * This module provides all the data layer functions needed for superadmins
 * to manage events, users, and system settings.
 *
 * @module data/superadmin
 */

// Event management actions
export {
  superadminEditEvent,
  superadminDeleteEvent,
  superadminRestoreEvent,
  superadminChangeStatus,
  superadminBulkDelete,
  superadminBulkChangeStatus,
  superadminBulkChangeCategory,
} from './superadmin-event-actions';

// Entity management actions (organizers, venues, performers, membership_orgs, series)
export {
  superadminEditEntity,
  superadminDeleteEntity,
  superadminCreateEntity,
} from './superadmin-entity-actions';

// Series cancel-or-delete with optional event cascade
export { superadminCancelOrDeleteSeries } from './delete-series';
export type {
  DeleteSeriesParams,
  DeleteSeriesResult,
  DeleteSeriesMode,
} from './delete-series';
export type {
  EditEntityParams,
  DeleteEntityParams,
  CreateEntityParams,
  SuperadminEntityType,
} from './superadmin-entity-actions';

// Types
export type {
  SuperadminActionResult,
  EditEventParams,
  DeleteEventParams,
  ChangeStatusParams,
} from './superadmin-event-actions';
