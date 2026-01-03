/**
 * SERIES COMPONENTS MODULE
 * ========================
 * UI components for displaying series (classes, camps, recurring events).
 *
 * Usage:
 * ```ts
 * import { SeriesCard, SeriesGrid, SeriesTypeBadge } from '@/components/series';
 * ```
 */

// Card components
export { SeriesCard } from './series-card';
export { SeriesTypeBadge, getSeriesTypeIcon } from './series-type-badge';
export { SeriesPrice, formatSeriesPrice } from './series-price';

// Grid components
export { SeriesGrid, FeaturedSeriesGrid } from './series-grid';

// Detail page components
export { SeriesHeader } from './series-header';
export { SeriesEventsList, SeriesEventsCompact } from './series-events-list';

// Event integration components
export { SeriesLinkBadge, SeriesIndicator } from './series-link-badge';

// Loading skeletons
export {
  SeriesCardSkeleton,
  SeriesGridSkeleton,
  SeriesDetailSkeleton,
} from './series-skeleton';
