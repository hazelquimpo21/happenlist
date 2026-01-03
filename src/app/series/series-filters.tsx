/**
 * SERIES FILTERS COMPONENT
 * ========================
 * Filter controls for the series listing page.
 * Client component for interactivity.
 */

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { SeriesTypeBadge } from '@/components/series';
import { SERIES_TYPE_INFO } from '@/types';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import type { SeriesType, SeriesSortOption } from '@/lib/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

interface SeriesFiltersProps {
  /** Available categories */
  categories: Category[];
  /** Currently selected type */
  currentType?: SeriesType;
  /** Currently selected category */
  currentCategory?: string;
  /** Current sort order */
  currentSort?: SeriesSortOption;
  /** Free filter active */
  isFree?: boolean;
  /** Current search query */
  searchQuery?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// SORT OPTIONS
// ============================================================================

const SORT_OPTIONS: { value: SeriesSortOption; label: string }[] = [
  { value: 'start-date-asc', label: 'Date (Soonest)' },
  { value: 'start-date-desc', label: 'Date (Latest)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'popular', label: 'Most Popular' },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Filter controls for series listing.
 */
export function SeriesFilters({
  categories,
  currentType,
  currentCategory,
  currentSort = 'start-date-asc',
  isFree = false,
  searchQuery,
  className,
}: SeriesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Update URL with new filter value.
   */
  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // Reset page when filters change
      params.delete('page');

      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    },
    [router, pathname, searchParams]
  );

  /**
   * Clear all filters.
   */
  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  /**
   * Check if any filters are active.
   */
  const hasActiveFilters = !!(currentType || currentCategory || isFree || searchQuery);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
          <input
            type="search"
            placeholder="Search classes & series..."
            defaultValue={searchQuery}
            onChange={(e) => {
              // Debounce search
              const value = e.target.value;
              const timeout = setTimeout(() => {
                updateFilter('q', value || null);
              }, 300);
              return () => clearTimeout(timeout);
            }}
            className={cn(
              'w-full h-11 pl-10 pr-4 rounded-full',
              'bg-warm-white border border-sand',
              'text-charcoal placeholder:text-stone',
              'focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral-light',
              'transition-colors'
            )}
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className={cn(
            'h-11 px-4 rounded-full',
            'bg-warm-white border border-sand',
            'text-charcoal',
            'focus:outline-none focus:border-coral',
            'cursor-pointer'
          )}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateFilter('type', null)}
          className={cn(
            'px-4 py-2 rounded-full text-body-sm font-medium transition-colors',
            !currentType
              ? 'bg-coral text-warm-white'
              : 'bg-sand text-charcoal hover:bg-coral-light'
          )}
        >
          All Types
        </button>

        {Object.entries(SERIES_TYPE_INFO).map(([type, info]) => (
          <button
            key={type}
            onClick={() => updateFilter('type', type)}
            className={cn(
              'px-4 py-2 rounded-full text-body-sm font-medium transition-colors',
              currentType === type
                ? 'bg-coral text-warm-white'
                : 'bg-sand text-charcoal hover:bg-coral-light'
            )}
          >
            {info.labelPlural}
          </button>
        ))}
      </div>

      {/* Category and Free filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category dropdown */}
        <select
          value={currentCategory || ''}
          onChange={(e) => updateFilter('category', e.target.value || null)}
          className={cn(
            'h-10 px-4 rounded-full',
            'bg-warm-white border border-sand',
            'text-charcoal',
            'focus:outline-none focus:border-coral',
            'cursor-pointer'
          )}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Free toggle */}
        <button
          onClick={() => updateFilter('free', isFree ? null : 'true')}
          className={cn(
            'h-10 px-4 rounded-full text-body-sm font-medium transition-colors',
            isFree
              ? 'bg-sage text-warm-white'
              : 'bg-sand text-charcoal hover:bg-sage/20'
          )}
        >
          Free Only
        </button>

        {/* Clear all button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-4 text-coral hover:underline text-body-sm flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Active filter summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-sand">
          <span className="text-body-sm text-stone">Active filters:</span>

          {currentType && (
            <Badge variant="outline" className="gap-1">
              {SERIES_TYPE_INFO[currentType]?.label || currentType}
              <button onClick={() => updateFilter('type', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {currentCategory && (
            <Badge variant="outline" className="gap-1">
              {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
              <button onClick={() => updateFilter('category', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {isFree && (
            <Badge variant="outline" className="gap-1">
              Free
              <button onClick={() => updateFilter('free', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {searchQuery && (
            <Badge variant="outline" className="gap-1">
              "{searchQuery}"
              <button onClick={() => updateFilter('q', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
