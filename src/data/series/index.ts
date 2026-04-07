/**
 * SERIES DATA MODULE
 * ==================
 * Server-side data fetching functions for series.
 *
 * Usage:
 * ```ts
 * import { getSeries, getSeriesBySlug } from '@/data/series';
 * ```
 */

// List & filter functions
export {
  getSeries,
  getFeaturedSeries,
  getSeriesByType,
} from './get-series';

// Detail functions
export {
  getSeriesBySlug,
  getSeriesById,
  getSeriesEvents,
  getRelatedSeries,
  getSeriesStats,
} from './get-series-detail';

// Event generation functions
export {
  createSingleEvent,
  generateCampEvents,
  generateRecurringEvents,
  createSeries,
  updateSeriesDates,
} from './generate-events';

export type {
  CreateEventResult,
  GenerateEventsResult,
} from './generate-events';
