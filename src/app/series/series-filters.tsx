/**
 * SERIES FILTERS COMPONENT
 * ========================
 * Filter controls for the series listing page.
 * Client component for interactivity.
 *
 * Phase E additions:
 *   - Attendance mode filter (Drop-in Welcome / Registration Required)
 *   - Age group filter (Toddler 0-3, Preschool 3-5, Kids 6-12, Teens 13-17, Adults 18+)
 *   - Skill level filter (Beginner, Intermediate, Advanced, All Levels)
 *   - Has After Care toggle (for camps — uses extended_end_time index)
 *   - Day of week filter
 *
 * All new filters map to existing getSeries() query params from Phase B.
 *
 * @module app/series/series-filters
 */

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui';
import { SERIES_TYPE_INFO } from '@/types';
import {
  ATTENDANCE_MODE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from '@/lib/constants/series-limits';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import type { SeriesType, AttendanceMode, SkillLevel } from '@/lib/supabase/types';
import type { SeriesSortOption } from '@/types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Sort options for series listing.
 */
const SORT_OPTIONS: { value: SeriesSortOption; label: string }[] = [
  { value: 'start-date-asc', label: 'Date (Soonest)' },
  { value: 'start-date-desc', label: 'Date (Latest)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'popular', label: 'Most Popular' },
];

/**
 * Age group presets for filtering.
 * Each maps to a representative age value that gets checked against
 * series.age_low and series.age_high in getSeries().
 */
const AGE_GROUP_OPTIONS = [
  { value: '2', label: 'Toddler (0-3)' },
  { value: '4', label: 'Preschool (3-5)' },
  { value: '9', label: 'Kids (6-12)' },
  { value: '15', label: 'Teens (13-17)' },
  { value: '25', label: 'Adults (18+)' },
] as const;

/**
 * Day of week options.
 * Value is the JS Date.getDay() index (0=Sun, 6=Sat).
 */
const DAY_OF_WEEK_OPTIONS = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
] as const;

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

  // -- Phase E: New filter values --
  /** Currently selected attendance mode */
  currentAttendanceMode?: AttendanceMode;
  /** Currently selected skill level */
  currentSkillLevel?: SkillLevel;
  /** Currently selected age filter value */
  currentAge?: string;
  /** Has extended care filter active */
  hasExtendedCare?: boolean;
  /** Currently selected day of week */
  currentDayOfWeek?: string;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Filter controls for series listing.
 *
 * Renders search, type, category, and advanced filters (attendance, age, skill, day).
 * All filters update URL search params and trigger server-side re-fetch.
 */
export function SeriesFilters({
  categories,
  currentType,
  currentCategory,
  currentSort = 'start-date-asc',
  isFree = false,
  searchQuery,
  currentAttendanceMode,
  currentSkillLevel,
  currentAge,
  hasExtendedCare = false,
  currentDayOfWeek,
  className,
}: SeriesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Toggle for showing/hiding advanced filters
  const [showAdvanced, setShowAdvanced] = useState(
    // Auto-open if any advanced filter is active
    !!(currentAttendanceMode || currentSkillLevel || currentAge || hasExtendedCare || currentDayOfWeek)
  );

  /**
   * Update URL with new filter value.
   * Resets page to 1 when filters change.
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
      console.log(`🔍 [SeriesFilters] Filter updated: ${key}=${value ?? 'cleared'}`, {
        url: `${pathname}${queryString ? `?${queryString}` : ''}`,
      });
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    },
    [router, pathname, searchParams]
  );

  /**
   * Clear all filters.
   */
  const clearFilters = useCallback(() => {
    console.log('🔍 [SeriesFilters] All filters cleared');
    router.push(pathname);
  }, [router, pathname]);

  /**
   * Check if any filters are active (basic or advanced).
   */
  const hasActiveFilters = !!(
    currentType ||
    currentCategory ||
    isFree ||
    searchQuery ||
    currentAttendanceMode ||
    currentSkillLevel ||
    currentAge ||
    hasExtendedCare ||
    currentDayOfWeek
  );

  // Count of active advanced filters (for badge display)
  const advancedFilterCount = [
    currentAttendanceMode,
    currentSkillLevel,
    currentAge,
    hasExtendedCare ? 'true' : null,
    currentDayOfWeek,
  ].filter(Boolean).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* ========== Search bar + Sort ========== */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone" />
          <input
            type="search"
            placeholder="Search classes & series..."
            defaultValue={searchQuery}
            onChange={(e) => {
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

      {/* ========== Type filter pills ========== */}
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

      {/* ========== Category, Free, and Advanced toggle row ========== */}
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

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'h-10 px-4 rounded-full text-body-sm font-medium transition-colors flex items-center gap-1.5',
            showAdvanced || advancedFilterCount > 0
              ? 'bg-coral/10 text-coral border border-coral/30'
              : 'bg-sand text-charcoal hover:bg-coral-light'
          )}
        >
          More Filters
          {advancedFilterCount > 0 && (
            <span className="bg-coral text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {advancedFilterCount}
            </span>
          )}
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
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

      {/* ====================================================== */}
      {/* PHASE E: Advanced Filters Panel                         */}
      {/* ====================================================== */}
      {showAdvanced && (
        <div className="p-4 bg-cream rounded-lg border border-sand space-y-4">
          <p className="text-sm font-medium text-charcoal">Advanced Filters</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* -- Attendance Mode -- */}
            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">
                Attendance
              </label>
              <select
                value={currentAttendanceMode || ''}
                onChange={(e) => updateFilter('attendance', e.target.value || null)}
                className={cn(
                  'w-full h-9 px-3 rounded-lg text-sm',
                  'bg-warm-white border border-sand',
                  'text-charcoal',
                  'focus:outline-none focus:border-coral',
                  'cursor-pointer'
                )}
              >
                <option value="">Any Attendance</option>
                {ATTENDANCE_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* -- Age Group -- */}
            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">
                Age Group
              </label>
              <select
                value={currentAge || ''}
                onChange={(e) => updateFilter('age', e.target.value || null)}
                className={cn(
                  'w-full h-9 px-3 rounded-lg text-sm',
                  'bg-warm-white border border-sand',
                  'text-charcoal',
                  'focus:outline-none focus:border-coral',
                  'cursor-pointer'
                )}
              >
                <option value="">Any Age</option>
                {AGE_GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* -- Skill Level -- */}
            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">
                Skill Level
              </label>
              <select
                value={currentSkillLevel || ''}
                onChange={(e) => updateFilter('skill', e.target.value || null)}
                className={cn(
                  'w-full h-9 px-3 rounded-lg text-sm',
                  'bg-warm-white border border-sand',
                  'text-charcoal',
                  'focus:outline-none focus:border-coral',
                  'cursor-pointer'
                )}
              >
                <option value="">Any Level</option>
                {SKILL_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* -- Day of Week -- */}
            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">
                Day of Week
              </label>
              <div className="flex gap-1">
                {DAY_OF_WEEK_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateFilter(
                        'day',
                        currentDayOfWeek === option.value ? null : option.value
                      )
                    }
                    className={cn(
                      'w-9 h-9 rounded-lg text-xs font-medium transition-colors',
                      currentDayOfWeek === option.value
                        ? 'bg-coral text-white'
                        : 'bg-warm-white border border-sand text-charcoal hover:border-coral/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* -- Has After Care Toggle (camp-specific) -- */}
            <div>
              <label className="block text-xs font-medium text-stone mb-1.5">
                Camp Options
              </label>
              <button
                onClick={() => updateFilter('aftercare', hasExtendedCare ? null : 'true')}
                className={cn(
                  'h-9 px-3 rounded-lg text-sm font-medium transition-colors',
                  hasExtendedCare
                    ? 'bg-sage text-warm-white'
                    : 'bg-warm-white border border-sand text-charcoal hover:bg-sage/10'
                )}
              >
                Has After Care
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Active filter summary ========== */}
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
              &ldquo;{searchQuery}&rdquo;
              <button onClick={() => updateFilter('q', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {/* Phase E: New filter badges */}
          {currentAttendanceMode && (
            <Badge variant="outline" className="gap-1">
              {ATTENDANCE_MODE_OPTIONS.find((o) => o.value === currentAttendanceMode)?.label || currentAttendanceMode}
              <button onClick={() => updateFilter('attendance', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {currentSkillLevel && (
            <Badge variant="outline" className="gap-1">
              {SKILL_LEVEL_OPTIONS.find((o) => o.value === currentSkillLevel)?.label || currentSkillLevel}
              <button onClick={() => updateFilter('skill', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {currentAge && (
            <Badge variant="outline" className="gap-1">
              {AGE_GROUP_OPTIONS.find((o) => o.value === currentAge)?.label || `Age ${currentAge}`}
              <button onClick={() => updateFilter('age', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {hasExtendedCare && (
            <Badge variant="outline" className="gap-1">
              After Care
              <button onClick={() => updateFilter('aftercare', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {currentDayOfWeek && (
            <Badge variant="outline" className="gap-1">
              {DAY_OF_WEEK_OPTIONS.find((o) => o.value === currentDayOfWeek)?.label || `Day ${currentDayOfWeek}`}
              <button onClick={() => updateFilter('day', null)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
