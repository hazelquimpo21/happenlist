/**
 * UTILITIES INDEX
 * ===============
 * Central export for all utility functions.
 */

// Class name utility
export { cn } from './cn';

// Date utilities
export {
  formatMKE,
  formatTimeMKE,
  formatDateTimeMKE,
  formatEventDate,
  formatDateRange,
  getTodayRange,
  getThisWeekendRange,
  getThisWeekRange,
  getMonthRange,
  parseMonthName,
} from './dates';

// Price utilities
export { formatPrice, isFreeEvent, getPriceClassName } from './price';

// URL utilities
export {
  buildEventUrl,
  parseEventSlug,
  buildVenueUrl,
  buildOrganizerUrl,
  buildCategoryUrl,
  buildSearchUrl,
  buildEventsUrl,
} from './url';

// Slug utilities
export { generateSlug, slugToTitle } from './slug';

// Logger utilities
export {
  createLogger,
  adminEventLogger,
  adminApiLogger,
  adminDataLogger,
  auditLogger,
  logAdminAction,
} from './logger';

// Recurrence utilities
export {
  calculateDatesInRange,
  calculateRecurringDates,
  addMinutesToTime,
} from './recurrence';

// Image utilities
export {
  isValidImageUrl,
  getSafeImageUrl,
  getBestImageUrl,
  extractImageFromScrapedData,
  getImageUrlIssue,
} from './image';

// Parent event utilities
export { getChildEventLabel } from './parent-event-labels';

// Event detail page helpers (used by /event/[slug] — price/age summaries,
// timing badge, calendar URL, past-event check)
export {
  getTimingBadge,
  formatPriceSummary,
  formatAgeSummary,
  isPastEvent,
  buildGoogleCalendarUrl,
  type TimingBadge,
} from './event-detail';
