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

// Series
export { getAdminSeries } from './get-admin-series';
export type { AdminSeriesCard, AdminSeriesFilters, AdminSeriesResult } from './get-admin-series';

// Single event
export { getAdminEvent, getEventAuditHistory } from './get-admin-event';
export type { AdminEventDetails } from './get-admin-event';

// Signal reviews + per-dimension overrides (tagging-expansion Stage 4)
export {
  getSignalReviewsForEvent,
  latestVerdictByDimension,
  createSignalReview,
  setSignalOverride,
} from './signal-reviews';
export type {
  SignalReview,
  ReviewVerdict,
  ReviewDimension,
  SignalOverrideValue,
} from './signal-reviews';

// Calibration dashboard (admin agreement-rate metrics)
export {
  getSignalsCalibration,
  agreementBand,
} from './get-signals-calibration';
export type {
  CalibrationData,
  DimensionStats,
  ReviewerStats,
  CalibrationActivityRow,
} from './get-signals-calibration';

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
