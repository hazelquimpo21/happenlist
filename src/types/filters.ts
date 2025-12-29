/**
 * FILTER TYPES
 * ============
 * Type definitions for filtering and pagination.
 */

/**
 * Date range for filtering events.
 */
export interface DateRange {
  start: string; // YYYY-MM-DD format
  end?: string;  // YYYY-MM-DD format
}

/**
 * Price range for filtering events.
 */
export interface PriceRange {
  min?: number;
  max?: number;
}

/**
 * Event filter parameters.
 */
export interface EventFilters {
  search?: string;
  categorySlug?: string;
  categoryIds?: string[];
  dateRange?: DateRange;
  isFree?: boolean;
  priceRange?: PriceRange;
  venueTypes?: string[];
  organizerId?: string;
  locationId?: string;
  excludeEventId?: string;
}

/**
 * Pagination parameters.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort options for events.
 */
export type SortOption = 'date-asc' | 'date-desc' | 'name-asc' | 'popular';

/**
 * Combined query parameters for events.
 */
export interface EventQueryParams extends EventFilters, PaginationParams {
  orderBy?: SortOption;
}
