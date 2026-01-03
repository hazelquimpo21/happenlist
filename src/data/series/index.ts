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
  getSeriesEvents,
  getRelatedSeries,
  getSeriesStats,
} from './get-series-detail';
