/**
 * ADMIN DATA FUNCTIONS
 * =====================
 * Barrel export for all admin data functions.
 */

// Stats and dashboard
export { getAdminStats, getRecentActivity } from './get-admin-stats';
export type { AdminStats, AuditLogEntry } from './get-admin-stats';

// Pending events
export { getPendingEvents, getAllAdminEvents } from './get-pending-events';
export type {
  AdminEventCard,
  PendingEventsFilters,
  PendingEventsResult,
} from './get-pending-events';

// Single event
export { getAdminEvent, getEventAuditHistory } from './get-admin-event';
export type { AdminEventDetails } from './get-admin-event';

// Event actions
export {
  approveEvent,
  rejectEvent,
  updateAdminEvent,
  bulkApproveEvents,
  bulkRejectEvents,
} from './event-actions';
export type {
  ApproveEventParams,
  RejectEventParams,
  UpdateEventParams,
  ActionResult,
} from './event-actions';
