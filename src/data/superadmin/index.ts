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
} from './superadmin-event-actions';

// Types
export type {
  SuperadminActionResult,
  EditEventParams,
  DeleteEventParams,
  ChangeStatusParams,
} from './superadmin-event-actions';
